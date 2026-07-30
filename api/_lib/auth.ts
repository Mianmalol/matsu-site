// ═══════════════════════════════════════════════════════════════════════════
//  SERVER-SIDE AUTHENTICATION
//
//  This file exists because Clerk's <SignedIn> does not protect anything here.
//  It withholds UI in the browser; it has no bearing on whether a request to a
//  Vercel Function is allowed to run. Without this check, /api/agent/* is an
//  open endpoint that turns anonymous HTTP requests into AI Gateway spend, and
//  the fact that the demo is "behind a login" is irrelevant to an attacker with
//  curl.
//
//  So: every route verifies a Clerk session JWT before it reads a request body
//  and before it reaches a model. Verification happens against Clerk's JWKS
//  using CLERK_SECRET_KEY, which is server-only and must never reach the bundle.
// ═══════════════════════════════════════════════════════════════════════════

import { verifyToken } from '@clerk/backend'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export interface AuthedUser {
  userId: string
}

/** Thrown for any condition that should stop the request before a model call. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

/**
 * Verify the caller and return their Clerk user id.
 *
 * Throws HttpError rather than writing a response, so callers can run this
 * inside one try/catch alongside validation and keep a single error path.
 */
export async function requireUser(req: VercelRequest): Promise<AuthedUser> {
  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) {
    // Fail closed. An unconfigured deployment must not silently become open.
    throw new HttpError(503, 'Auth is not configured on this deployment.')
  }

  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Missing bearer token.')
  }

  const token = header.slice('Bearer '.length).trim()
  if (!token) throw new HttpError(401, 'Empty bearer token.')

  try {
    const claims = await verifyToken(token, { secretKey })
    if (!claims.sub) throw new HttpError(401, 'Token carries no subject.')
    return { userId: claims.sub }
  } catch (err) {
    if (err instanceof HttpError) throw err
    throw new HttpError(401, 'Invalid or expired session token.')
  }
}

/**
 * Best-effort per-user rate limiting.
 *
 * Held in module scope, which means it is per warm instance rather than global:
 * a burst spread across cold starts gets more budget than this implies. It is
 * therefore a courtesy limit, NOT the spend control. The real ceilings are the
 * per-request bounds in guard.ts (which cap how much work a single accepted
 * call can do) and a spend limit configured on the Vercel AI Gateway itself.
 *
 * Doing better needs shared storage, which this project deliberately does not
 * provision. If demo traffic ever justifies it, move this to Upstash Redis and
 * delete this comment.
 */
const hits = new Map<string, number[]>()

export function rateLimit(userId: string, max: number, windowMs: number): void {
  const now = Date.now()
  const recent = (hits.get(userId) ?? []).filter(t => now - t < windowMs)

  if (recent.length >= max) {
    throw new HttpError(429, 'Too many agent runs. Wait a minute and try again.')
  }

  recent.push(now)
  hits.set(userId, recent)

  // Keep the map from growing without bound on a long-lived instance.
  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (times.every(t => now - t >= windowMs)) hits.delete(key)
    }
  }
}

/** Uniform error responder so every route fails the same shape. */
export function fail(res: VercelResponse, err: unknown): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  console.error('[agent] unhandled', err)
  res.status(500).json({ error: 'Agent run failed.' })
}

/** Rejects anything but POST, so a crawler hitting the URL gets 405 not a run. */
export function requirePost(req: VercelRequest): void {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.')
}
