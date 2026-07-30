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
