// ═══════════════════════════════════════════════════════════════════════════
//  THE AGENTS
//
//  One function per pipeline stage, each doing exactly one model call and
//  handing the result through the guard before returning it.
//
//  These live apart from the HTTP routes because they have two callers with
//  very different needs:
//
//    · api/agent/*.ts — adds auth, rate limiting and request validation, then
//      delegates here. Every browser-driven run goes this way.
//    · scripts/seed-run.ts — calls these directly to produce the committed
//      canonical run. It has no HTTP request to authenticate and no user to
//      rate limit, and making it fake one would be theatre.
//
//  Nothing in here reads process.env beyond what the AI SDK does for Gateway
//  credentials, and nothing in here knows about requests or responses.
//
//  Stage 6 has no function here on purpose. DPA approval is a human decision.
// ═══════════════════════════════════════════════════════════════════════════

import { generateObject } from 'ai'
import {
  CORPUS,
  CORPUS_VERSION,
  CURRENT_THROUGH,
  PREVIOUS_SCAN,
  amendedSince,
  applicableRecords,
  instrumentsInForce,
} from '../../shared/corpus'
import type {
  ComplianceAction,
  EvidenceItem,
  Requirement,
  ScanResult,
  Vessel,
} from '../../shared/types'
import {
  type GuardReport,
  acceptActions,
  acceptEvidence,
  acceptRequirements,
  emptyReport,
} from './guard'
import { CALL_TIMEOUT_MS, MAX_OUTPUT_TOKENS, MODEL, abortAfter } from './model'
import {
  actionsSchema,
  assignmentSchema,
  evidenceSchema,
  requirementsSchema,
  scanSchema,
} from './schemas'
import type { AssignmentOutput } from './schemas'

/** The hull's own facts, phrased for a prompt. */
export function vesselBrief(v: Vessel): string {
  return [
    `Vessel: ${v.name} (IMO ${v.imo})`,
    `Type: ${v.type}`,
    `Flag: ${v.flag}`,
    `Built: ${v.built}`,
    `Gross tonnage: ${v.gt.toLocaleString()}`,
    `Deadweight: ${v.dwt.toLocaleString()} t`,
    v.teu > 0 ? `Capacity: ${v.teu.toLocaleString()} TEU` : null,
    `Fuel: ${v.fuel}`,
    `Trading area: ${v.tradingArea} (${v.route})`,
  ]
    .filter(Boolean)
    .join('\n')
}

// ── Stage 1 ──────────────────────────────────────────────────────────────────

export async function runScan(): Promise<ScanResult> {
  const changed = amendedSince(PREVIOUS_SCAN)
  const instruments = instrumentsInForce()

  const { object } = await generateObject({
    model: MODEL,
    schema: scanSchema,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal: abortAfter(CALL_TIMEOUT_MS),
    system:
      'You are the regulation scanning stage of a maritime compliance pipeline. ' +
      'You are reading an indexed corpus of IMO and regional instruments bundled with this ' +
      'application. You are NOT connected to any live regulatory feed and must not imply that you are. ' +
      'Describe what the index contains and what changed between corpus versions. ' +
      'Use only the figures given to you. Never state a count you were not given.',
    prompt: [
      `Corpus version ${CORPUS_VERSION}, reviewed against published sources through ${CURRENT_THROUGH}.`,
      `Records indexed: ${CORPUS.length}.`,
      `Instruments represented: ${instruments.join('; ')}.`,
      '',
      `Records amended since the previous corpus version (${PREVIOUS_SCAN}):`,
      ...changed.map(r => `  ${r.id} — ${r.instrument}, ${r.reference} (amended ${r.amendedAt})`),
      '',
      'Write two sentences for an operations readout: what the index covers, and what changed.',
    ].join('\n'),
  })

  return {
    recordsIndexed: CORPUS.length,
    instrumentsInForce: instruments,
    changedSince: changed.map(r => ({
      id: r.id,
      reference: `${r.instrument} — ${r.reference}`,
      amendedAt: r.amendedAt!,
    })),
    summary: object.summary,
  }
}

// ── Stage 2 ──────────────────────────────────────────────────────────────────

export async function runRequirements(
  vessel: Vessel,
): Promise<{ requirements: Requirement[]; report: GuardReport }> {
  const records = applicableRecords(vessel)
  const allowed = new Set(records.map(r => r.id))
  const report = emptyReport()

  const { object } = await generateObject({
    model: MODEL,
    schema: requirementsSchema,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal: abortAfter(CALL_TIMEOUT_MS),
    system:
      'You are the requirement extraction stage of a maritime compliance pipeline. ' +
      'You turn regulatory records into discrete, checkable obligations for one specific vessel. ' +
      'Every obligation must cite the sourceId of the record it came from, and that id must be one ' +
      'of the ids listed in the prompt. Never invent an id, a regulation, or a threshold. ' +
      'Write obligations specific to this hull, not generic restatements of the record.',
    prompt: [
      vesselBrief(vessel),
      '',
      'These records have already been determined to apply to this vessel:',
      '',
      ...records.map(r =>
        [
          `[${r.id}] ${r.instrument} — ${r.reference}`,
          `  ${r.title}`,
          `  ${r.summary}`,
          `  Cadence: ${r.periodicity}. Evidence: ${r.evidenceType}. Category: ${r.category}.`,
        ].join('\n'),
      ),
      '',
      'Extract the discrete obligations these place on this vessel. Prefer one obligation per',
      'distinct thing the crew or shore team must do or hold. Do not merge unrelated duties into',
      'one line, and do not split one duty into near-duplicates.',
      '',
      'Return AT MOST 30 obligations. Where the records give you more than that, keep the ones',
      'that generate real recurring work on this hull and drop the purely nominal ones. Keep each',
      'obligation under 240 characters.',
    ].join('\n'),
  })

  return { requirements: acceptRequirements(vessel, object, allowed, report), report }
}

// ── Stage 3 ──────────────────────────────────────────────────────────────────

export async function runAssignment(
  vessel: Vessel,
  requirements: Requirement[],
): Promise<AssignmentOutput> {
  const records = applicableRecords(vessel)

  const { object } = await generateObject({
    model: MODEL,
    schema: assignmentSchema,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal: abortAfter(CALL_TIMEOUT_MS),
    system:
      'You are the vessel assignment stage of a maritime compliance pipeline. ' +
      'The applicability determination has already been made deterministically. Your job is to ' +
      'explain WHY this hull draws this particular set, naming the attributes that decided it. ' +
      'Do not add or remove obligations.',
    prompt: [
      vesselBrief(vessel),
      '',
      `${requirements.length} obligations were assigned to this hull, drawn from ${records.length} applicable records.`,
      '',
      'Instruments that apply to this vessel and would not apply to every vessel in a mixed fleet:',
      ...records
        .filter(r => Object.keys(r.applicability).length > 0)
        .map(r => `  ${r.id} — ${r.title}`),
      '',
      'Explain the profile in a short paragraph, then list the attributes that most shaped it.',
    ].join('\n'),
  })

  return object
}

// ── Stage 4 ──────────────────────────────────────────────────────────────────

export async function runActions(
  vessel: Vessel,
  requirements: Requirement[],
): Promise<{ actions: ComplianceAction[]; report: GuardReport }> {
  const report = emptyReport()

  const { object } = await generateObject({
    model: MODEL,
    schema: actionsSchema,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal: abortAfter(CALL_TIMEOUT_MS),
    system:
      'You are the action assignment stage of a maritime compliance pipeline. ' +
      'You turn obligations into concrete, dated tasks a real crew or shore team could carry out. ' +
      'Every action cites the requirementId it discharges, and that id must be one listed below. ' +
      'Derive the due date offset from the obligation cadence. Vary the statuses realistically: ' +
      'a working ship has most things done, several in progress, and occasionally something overdue.',
    prompt: [
      vesselBrief(vessel),
      '',
      'Obligations assigned to this hull:',
      ...requirements.map(
        r => `  [${r.id}] ${r.obligation} (cadence: ${r.periodicity}; evidence: ${r.evidenceType})`,
      ),
      '',
      'Generate the compliance actions these obligations require. Cover the obligations that would',
      'realistically have live work against them right now — not every obligation needs an open action.',
      '',
      'Return AT MOST 20 actions. Keep each action under 200 characters.',
    ].join('\n'),
  })

  return { actions: acceptActions(vessel, object, requirements, report), report }
}

// ── Stage 5 ──────────────────────────────────────────────────────────────────

export async function runEvidence(
  vessel: Vessel,
  actions: ComplianceAction[],
): Promise<{ evidence: EvidenceItem[]; report: GuardReport }> {
  const report = emptyReport()

  const { object } = await generateObject({
    model: MODEL,
    schema: evidenceSchema,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal: abortAfter(CALL_TIMEOUT_MS),
    system:
      'You are the evidence collection stage of a maritime compliance pipeline. ' +
      'For each action, describe the document the vessel would submit and judge whether it ' +
      'satisfies the linked action. Be a real validator: some submissions are incomplete, expired, ' +
      'unsigned, or inconsistent with what was asked for, and those must be rejected with a specific ' +
      'reason. A validator that accepts everything is useless. Reject roughly one in six.',
    prompt: [
      vesselBrief(vessel),
      '',
      'Actions awaiting evidence:',
      ...actions.map(
        a => `  [${a.id}] ${a.action} (due ${a.due}, ${a.status}; expects ${a.evidenceType})`,
      ),
      '',
      'For each action that would plausibly have a submission by now, describe the document and',
      'give a verdict. Actions still open in the future should be left without evidence rather than',
      'given a fabricated submission.',
      '',
      'Return AT MOST 16 evidence items. Keep each reason under 240 characters.',
    ].join('\n'),
  })

  return { evidence: acceptEvidence(vessel, object, actions, report), report }
}
