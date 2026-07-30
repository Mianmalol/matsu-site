// ═══════════════════════════════════════════════════════════════════════════
//  STAGE 1 — REGULATION SCANNING (fleet-wide, one call)
//
//  Runs once per fleet run rather than once per hull, because the corpus is the
//  same for every ship. The counts and the changed-record list come from code;
//  the model writes only the readout sentence. Numbers are not something a
//  language model should produce when we already know them exactly.
//
//  The work itself lives in _lib/stages.ts so the seed script can call it
//  without an HTTP request to authenticate.
// ═══════════════════════════════════════════════════════════════════════════

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fail, rateLimit, requirePost, requireUser } from '../_lib/auth'
import { LIMITS } from '../_lib/guard'
import { runScan } from '../_lib/stages'

export const config = { maxDuration: 60 }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requirePost(req)
    const { userId } = await requireUser(req)
    rateLimit(userId, LIMITS.rateMax, LIMITS.rateWindowMs)

    res.status(200).json(await runScan())
  } catch (err) {
    fail(res, err)
  }
}
