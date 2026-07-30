// ═══════════════════════════════════════════════════════════════════════════
//  STAGES 2–5 — ONE HULL, ONE STAGE, ONE INVOCATION
//
//  Why it is shaped this way: the obvious design is one function that streams a
//  whole fleet run. That design dies on Vercel. SSE does not extend a function's
//  maxDuration — heartbeats keep the socket open while the platform kills the
//  invocation anyway — so a 20-call run is a coin flip against the deadline.
//
//  So each call does exactly one stage for one hull and returns. The browser
//  orchestrates the sequence and renders progress as results land. A stage that
//  fails costs one stage, not the whole run, and every invocation finishes in
//  seconds rather than minutes.
//
//  The cost is that stage N+1 receives stage N's output from the CLIENT, which
//  makes it untrusted input. Everything is re-validated against the schema,
//  bounded by LIMITS, and stripped to known fields before any of it reaches a
//  prompt. Applicability is re-derived server-side from the vessel id, so a
//  client cannot widen the obligation set by lying about what stage 2 returned.
//
//  Stage 6 is not here. DPA approval is a human decision and no model touches it.
// ═══════════════════════════════════════════════════════════════════════════

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { FLEET_BY_ID } from '../../shared/fleet'
import type { ComplianceAction, Requirement } from '../../shared/types'
import { HttpError, fail, rateLimit, requirePost, requireUser } from '../_lib/auth'
import { LIMITS } from '../_lib/guard'
import { runActions, runAssignment, runEvidence, runRequirements } from '../_lib/stages'

export const config = { maxDuration: 60 }

/** What the client is allowed to hand back between stages. Nothing else survives. */
const bodySchema = z.object({
  vesselId: z.string().max(64),
  stage: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  requirements: z
    .array(
      z.object({
        id: z.string().max(32),
        sourceId: z.string().max(32),
        obligation: z.string().max(240),
        category: z.enum(['Safety', 'Environmental', 'Crew', 'Security', 'Labour', 'Technical']),
        periodicity: z.string().max(60),
        evidenceType: z.enum([
          'Certificate',
          'Record book',
          'Drill report',
          'Survey report',
          'Plan',
          'Log',
          'Analysis report',
        ]),
      }),
    )
    .max(LIMITS.maxRequirementsIn)
    .optional(),
  actions: z
    .array(
      z.object({
        id: z.string().max(32),
        requirementId: z.string().max(32),
        action: z.string().max(200),
        due: z.string().max(12),
        status: z.enum(['done', 'in-progress', 'open', 'overdue']),
        evidenceType: z.enum([
          'Certificate',
          'Record book',
          'Drill report',
          'Survey report',
          'Plan',
          'Log',
          'Analysis report',
        ]),
      }),
    )
    .max(LIMITS.maxActionsIn)
    .optional(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requirePost(req)
    const { userId } = await requireUser(req)
    rateLimit(userId, LIMITS.rateMax, LIMITS.rateWindowMs)

    const parsed = bodySchema.safeParse(req.body)
    if (!parsed.success) throw new HttpError(400, 'Malformed request body.')

    const { vesselId, stage } = parsed.data
    const vessel = FLEET_BY_ID[vesselId]
    if (!vessel) throw new HttpError(400, 'Unknown vessel.')

    const requirements = (parsed.data.requirements ?? []) as Requirement[]
    const actions = (parsed.data.actions ?? []) as ComplianceAction[]

    if (stage === 2) {
      const { requirements: out, report } = await runRequirements(vessel)
      res.status(200).json({ stage, vesselId, requirements: out, report })
      return
    }

    if (stage === 3) {
      if (requirements.length === 0) throw new HttpError(400, 'Stage 3 needs stage 2 output.')
      const assignment = await runAssignment(vessel, requirements)
      res.status(200).json({ stage, vesselId, assignment })
      return
    }

    if (stage === 4) {
      if (requirements.length === 0) throw new HttpError(400, 'Stage 4 needs stage 2 output.')
      const { actions: out, report } = await runActions(vessel, requirements)
      res.status(200).json({ stage, vesselId, actions: out, report })
      return
    }

    if (actions.length === 0) throw new HttpError(400, 'Stage 5 needs stage 4 output.')
    const { evidence, report } = await runEvidence(vessel, actions)
    res.status(200).json({ stage, vesselId, evidence, report })
  } catch (err) {
    fail(res, err)
  }
}
