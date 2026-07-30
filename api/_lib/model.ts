// ═══════════════════════════════════════════════════════════════════════════
//  MODEL ACCESS — via Vercel AI Gateway
//
//  The AI SDK's default provider is the Vercel AI Gateway, so a bare
//  'anthropic/claude-haiku-4.5' model string routes through it with no client
//  construction. Credentials resolve in this order without any code here:
//
//    · On Vercel (production and preview): the deployment's OIDC token.
//    · Locally under `vercel dev`: the OIDC token pulled by `vercel env pull`,
//      which EXPIRES. When agent calls start failing locally with an auth error
//      and nothing else changed, re-run `vercel env pull` before debugging.
//    · Anywhere else: AI_GATEWAY_API_KEY, if one is set.
//
//  Plain `vite dev` serves none of this — it does not run functions at all.
//  Local full-stack work needs `vercel dev`.
// ═══════════════════════════════════════════════════════════════════════════

// From 'ai', a direct dependency. The Gateway's own error classes live in
// @ai-sdk/gateway, which is transitive and deliberately not imported — see the
// failure-classification section below.
import { APICallError } from 'ai'

/**
 * Haiku 4.5, chosen over Sonnet and Opus because the work these agents do is
 * structured extraction and classification against a corpus that has already
 * been narrowed deterministically — not open-ended reasoning. A full fleet run
 * costs roughly $0.27 here against roughly $1.35 on Opus.
 *
 * If stage 2's obligations start reading thin, raise THIS stage rather than
 * the whole pipeline: extraction is the only step where model quality is
 * load-bearing.
 */
export const MODEL = 'anthropic/claude-haiku-4.5'

/** Recorded into every committed run so a stale fixture is self-describing. */
export const MODEL_ID = MODEL

/**
 * Ceiling on output tokens per call.
 *
 * 4,000 was too low and failed in the least helpful way: extraction for a hull
 * with 49 applicable records stopped at exactly the cap with finishReason
 * 'length', mid-JSON, so the whole response failed to parse and the stage
 * returned nothing. A truncated structured response is a total loss, not a
 * partial one.
 *
 * 12,000 is headroom rather than a target — output is billed on what is used,
 * not on the cap. The real bound on generation size is the explicit item limit
 * in the extraction prompt, which keeps a call comfortably inside the 60s
 * function budget. Raising this without also bounding the prompt would just
 * move the failure from a parse error to a platform timeout.
 */
export const MAX_OUTPUT_TOKENS = 12_000

/**
 * Wall-clock budget for a single model call.
 *
 * The default is set well under the function's own maxDuration so a slow
 * provider surfaces as a clean error rather than the platform killing the
 * invocation mid-write.
 *
 * The seed script overrides it via AGENT_CALL_TIMEOUT_MS because it has no
 * platform deadline to respect — it is a local batch job, and failing a whole
 * fleet run because one stage took 50 seconds would be pointless. Do NOT raise
 * the default to match: on the request path, a timeout longer than maxDuration
 * just means the platform kills the invocation first and the caller gets a
 * truncated response instead of an error.
 */
export const CALL_TIMEOUT_MS = Number(process.env.AGENT_CALL_TIMEOUT_MS) || 45_000

export function abortAfter(ms: number): AbortSignal {
  return AbortSignal.timeout(ms)
}

// ── Failure classification ───────────────────────────────────────────────────
//
//  A model call can fail for reasons the operator can fix in ten seconds — a
//  PDF that is too long, credits that ran out — and for reasons only we can.
//  Reporting both as "Agent run failed." wastes the difference. This turns the
//  first kind into something worth reading and leaves the second alone.
//
//  Everything below reads the error shape the SDK actually produces, which is
//  not the obvious one:
//
//    · The thrown error is the Gateway's wrapper. The APICallError carrying the
//      status and body is its `cause`, so testing only the top level finds
//      nothing.
//    · That inner APICallError's `message` is the literal string
//      "[object Object]". The readable sentence lives on the OUTER error's
//      message, and again inside `responseBody` as JSON. Both are collected.
//    · The wrapper class lives in @ai-sdk/gateway, a transitive dependency. It
//      is deliberately not imported. APICallError comes from 'ai', which this
//      project depends on directly.
//
//  This describes; auth.ts responds. Returning a plain shape rather than an
//  HttpError keeps the dependency pointing one way — auth.ts imports this file,
//  never the reverse — instead of a cycle between the two.

/**
 * Shared so the pre-flight check in the evidence route and the provider's own
 * rejection say the same thing. Whichever catches it first, the operator reads
 * one sentence and knows what to do.
 */
export const PAGE_LIMIT_MESSAGE =
  'That PDF has more than 100 pages, which is the most the validator can read in one pass. Upload just the pages that evidence this action.'

export interface ModelFailure {
  status: number
  message: string
}

/** Walk `cause` links, collecting every error in the chain. Bounded. */
function chain(err: unknown): unknown[] {
  const out: unknown[] = []
  let cur = err
  for (let i = 0; i < 4 && cur != null; i++) {
    out.push(cur)
    cur = (cur as { cause?: unknown }).cause
  }
  return out
}

/** Every human-readable sentence the chain offers, provider body included. */
function messages(links: unknown[]): string[] {
  const out: string[] = []
  for (const link of links) {
    const msg = (link as { message?: unknown }).message
    // "[object Object]" is what APICallError stringifies a structured provider
    // error into. It is noise, and matching against it would be matching noise.
    if (typeof msg === 'string' && msg && msg !== '[object Object]') out.push(msg)

    if (APICallError.isInstance(link) && typeof link.responseBody === 'string') {
      try {
        const body = JSON.parse(link.responseBody) as { error?: { message?: unknown } }
        if (typeof body.error?.message === 'string') out.push(body.error.message)
      } catch {
        // Not JSON. The outer message is the fallback and is usually the better
        // of the two anyway.
      }
    }
  }
  return out
}

/** First numeric HTTP status found anywhere in the chain. */
function status(links: unknown[]): number | undefined {
  for (const link of links) {
    const code = (link as { statusCode?: unknown }).statusCode
    if (typeof code === 'number') return code
  }
  return undefined
}

/**
 * Turn a failed model call into a response worth showing, or null.
 *
 * Null is the important return: an unrecognised fault stays a 500 and stays
 * loud in the logs. Dressing up an error we do not understand as one we do is
 * worse than saying nothing, because it stops anyone looking further.
 */
export function describeModelError(err: unknown): ModelFailure | null {
  const links = chain(err)
  const said = messages(links)
  const joined = said.join(' ')
  const code = status(links)

  // Abort fires when CALL_TIMEOUT_MS elapses. AbortSignal.timeout rejects with
  // a TimeoutError; a plain abort gives AbortError. Treat both as "too slow".
  const name = (err as { name?: unknown }).name
  if (name === 'TimeoutError' || name === 'AbortError' || /\baborted\b/i.test(joined)) {
    return { status: 504, message: 'The validator took too long to answer. Try again.' }
  }

  if (/maximum of \d+ PDF pages/i.test(joined)) {
    return { status: 400, message: PAGE_LIMIT_MESSAGE }
  }

  if (code === 402 || /\b(credit|quota|billing|insufficient funds)\b/i.test(joined)) {
    return {
      status: 402,
      message:
        'The AI Gateway is out of credits, so the agents cannot run. Top up the balance in the Vercel dashboard.',
    }
  }

  if (code === 429 || /rate.?limit/i.test(joined)) {
    return {
      status: 429,
      message: 'The model provider is rate limiting us. Wait a moment and try again.',
    }
  }

  if (code !== undefined && code >= 400 && code < 500) {
    // A 4xx we have no specific mapping for is still more the caller's problem
    // than ours, so pass the provider's own sentence through when it reads like
    // one. Long or multi-line bodies are withheld: they tend to carry request
    // internals, and this string gets rendered in the UI.
    const clean = said.find(m => m.length <= 160 && !m.includes('\n'))
    return {
      status: 400,
      message:
        clean ?
          `The validator rejected this document: ${clean}`
        : 'The validator rejected this document.',
    }
  }

  return null
}
