// ═══════════════════════════════════════════════════════════════════════════
//  STAGE OUTPUT SCHEMAS
//
//  What the model is allowed to return, per stage. Two things to hold onto:
//
//  1. A schema constrains SHAPE, not TRUTH. Passing validation here proves the
//     model returned the right fields, not that the obligation exists or the
//     citation is real. Citations are checked separately, against the corpus,
//     in guard.ts — that is the check that actually matters.
//
//  2. There are NO length or range constraints here, and that is deliberate.
//     Anthropic's structured-output mode does not enforce string minLength /
//     maxLength, array maxItems, or numeric minimum / maximum. Leaving them in
//     the Zod schema does not bound the model — it just means an overrun gets
//     the ENTIRE response rejected, losing output that was otherwise fine.
//     Bounds are re-imposed in guard.ts, where a too-long string is truncated
//     and a too-long array is sliced instead of thrown away. Lengths are asked
//     for in the field descriptions, which the model does read.
//
//  Note what is NOT here: the model never supplies IDs. Requirement, action and
//  evidence IDs are derived deterministically in guard.ts so they are stable
//  across runs. A model-authored ID changes every run and silently breaks every
//  reference that points at it.
// ═══════════════════════════════════════════════════════════════════════════

import { z } from 'zod'

const CATEGORY = z.enum([
  'Safety',
  'Environmental',
  'Crew',
  'Security',
  'Labour',
  'Technical',
])

const EVIDENCE_TYPE = z.enum([
  'Certificate',
  'Record book',
  'Drill report',
  'Survey report',
  'Plan',
  'Log',
  'Analysis report',
])

// ── Stage 1: regulation scanning ─────────────────────────────────────────────
// Fleet-wide, run once. The counts and the changed-record list are computed in
// code from the corpus; the model only writes the readout prose, because those
// are numbers and it has no business inventing numbers.

export const scanSchema = z.object({
  summary: z
    .string()
    .describe(
      'Two sentences on the state of the indexed corpus and what changed in this version. Do not invent counts; use only the figures given.',
    ),
})

// ── Stage 2: requirement extraction ──────────────────────────────────────────

export const requirementsSchema = z.object({
  requirements: z
    .array(
      z.object({
        sourceId: z
          .string()
          .describe(
            'The id of the corpus record this obligation comes from. Must be one of the ids provided. Never invent one.',
          ),
        obligation: z
          .string()
          .describe(
            'One concrete thing this vessel must do or hold, in a single sentence, specific to this hull.',
          ),
        category: CATEGORY,
        periodicity: z.string(),
        evidenceType: EVIDENCE_TYPE,
      }),
    ),
})

// ── Stage 3: vessel assignment ───────────────────────────────────────────────
// Applicability itself is decided in code. The model explains the resulting
// profile; it does not get to add or remove requirements here.

export const assignmentSchema = z.object({
  summary: z
    .string()
    .describe(
      'Why this hull draws the obligation set it does, naming the specific attributes that decided it.',
    ),
  drivers: z
    .array(z.string())
    .describe('The vessel attributes that most changed this set, e.g. fuel type or build year.'),
})

// ── Stage 4: action assignment ───────────────────────────────────────────────

export const actionsSchema = z.object({
  actions: z
    .array(
      z.object({
        requirementId: z
          .string()
          .describe('The id of the requirement this action discharges. Must be one provided.'),
        action: z
          .string()
          .describe('An imperative task an actual crew or shore team could carry out.'),
        dueInDays: z
          .number()
          .int()
          .describe(
            'Days from today the action is due. Negative means already overdue. Derive from the periodicity.',
          ),
        status: z.enum(['done', 'in-progress', 'open', 'overdue']),
        evidenceType: EVIDENCE_TYPE,
      }),
    ),
})

// ── Stage 5: evidence collection ─────────────────────────────────────────────

export const evidenceSchema = z.object({
  evidence: z
    .array(
      z.object({
        actionId: z.string().describe('The id of the action this evidence discharges.'),
        label: z.string().describe('What the document is called.'),
        type: EVIDENCE_TYPE,
        verdict: z.enum(['accepted', 'rejected', 'pending']),
        reason: z
          .string()
          .describe(
            'Why it was accepted or rejected, referring to what the linked requirement asks for.',
          ),
      }),
    ),
})

// ── Uploaded evidence validation ─────────────────────────────────────────────

export const uploadVerdictSchema = z.object({
  verdict: z.enum(['accepted', 'rejected', 'pending']),
  reason: z
    .string()
    .describe('What the document appears to be and whether it satisfies the linked requirement.'),
  documentType: z
    .string()
    .describe('What kind of document this appears to be, in the uploader\'s terms.'),
  concerns: z
    .array(z.string())
    .describe('Anything missing, expired, illegible, or inconsistent with the requirement.'),
})

export type ScanOutput = z.infer<typeof scanSchema>
export type RequirementsOutput = z.infer<typeof requirementsSchema>
export type AssignmentOutput = z.infer<typeof assignmentSchema>
export type ActionsOutput = z.infer<typeof actionsSchema>
export type EvidenceOutput = z.infer<typeof evidenceSchema>
export type UploadVerdict = z.infer<typeof uploadVerdictSchema>
