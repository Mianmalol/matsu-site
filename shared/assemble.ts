// ═══════════════════════════════════════════════════════════════════════════
//  ASSEMBLY — raw stage output into the shape the UI renders
//
//  Entirely deterministic. No model call happens in this file, and none should
//  be added: statuses, counts and the DPA queue are all facts about data we
//  already hold, and asking a model to restate them is how a demo ends up
//  showing "complete" next to an overdue action.
//
//  Imported by both scripts/seed-run.ts and the browser, so a live re-run in
//  the demo produces exactly the same shape as the committed canonical run.
//  That is the whole reason it is here rather than in either of them.
// ═══════════════════════════════════════════════════════════════════════════

import type {
  AgentEvent,
  ActionStatus,
  ApprovalItem,
  ComplianceAction,
  EvidenceItem,
  Requirement,
  StageResult,
  StageStatus,
  Vessel,
  VesselRun,
} from './types.js'

/** Stage titles, kept in one place so the sidebar, dashboard and detail agree. */
export const STAGE_LABELS: Record<number, { label: string; short: string }> = {
  1: { label: 'Regulation Scanning', short: 'Scanning' },
  2: { label: 'Requirement Extraction', short: 'Extraction' },
  3: { label: 'Vessel Assignment', short: 'Assignment' },
  4: { label: 'Action Assignment', short: 'Actions' },
  5: { label: 'Evidence Collection', short: 'Evidence' },
  6: { label: 'DPA Approval', short: 'Approval' },
}

/** Worst status wins. A fleet card that reads green while a stage is amber is a lie. */
const SEVERITY: Record<StageStatus, number> = {
  complete: 0,
  active: 1,
  pending: 2,
  'needs-review': 3,
}

export function worstOf(statuses: StageStatus[]): StageStatus {
  return statuses.reduce(
    (worst, s) => (SEVERITY[s] > SEVERITY[worst] ? s : worst),
    'complete' as StageStatus,
  )
}

/** Deterministic id for a DPA queue item. Mirrors the server's approvalId(). */
function approvalKey(evidenceId: string): string {
  return `APR-${evidenceId.replace(/^EV-/, '')}`
}

/**
 * The DPA queue.
 *
 * Only ACCEPTED evidence reaches a human. Rejected evidence goes back to the
 * vessel for resubmission — putting it in the approval queue would ask the DPA
 * to sign off on something the pipeline already refused, which is not a
 * workflow, it is a trap.
 */
export function buildApprovals(
  evidence: EvidenceItem[],
  actions: ComplianceAction[],
): ApprovalItem[] {
  const actionById = new Map(actions.map(a => [a.id, a]))

  return evidence
    .filter(e => e.verdict === 'accepted')
    .map(e => ({
      id: approvalKey(e.id),
      evidenceId: e.id,
      summary: `${e.label} — ${actionById.get(e.actionId)?.action ?? 'linked action'}`,
      state: 'awaiting' as const,
    }))
}

export interface VesselParts {
  vessel: Vessel
  /** Fleet-wide, so it is passed in rather than recomputed per hull. */
  recordsIndexed: number
  applicableRecordCount: number
  requirements: Requirement[]
  assignmentSummary: string
  actions: ComplianceAction[]
  evidence: EvidenceItem[]
  approvals: ApprovalItem[]
}

/**
 * The one place an action's status is decided.
 *
 * Every branch is a fact the system already holds — the due date it generated
 * and the verdicts stage 5 reached — so nothing here is a claim by a model or
 * by whoever clicked last. That matters more than it sounds: the model used to
 * pick the label itself, which let an action sit at "overdue" with an accepted
 * certificate filed against it, and let "open" and "in-progress" mean the same
 * nothing.
 *
 * `today` is a parameter rather than a call to Date so this stays pure and the
 * seeded run and the browser can be compared without one of them drifting.
 */
export function deriveActionStatus(
  action: ComplianceAction,
  discharged: Set<string>,
  today: string,
): ActionStatus {
  if (discharged.has(action.id)) return 'done'
  return action.due < today ? 'overdue' : 'open'
}

export function deriveActionStatuses(
  actions: ComplianceAction[],
  evidence: EvidenceItem[],
  today = new Date().toISOString().slice(0, 10),
): ComplianceAction[] {
  const discharged = dischargedActionIds(evidence)
  return actions.map(a => {
    const status = deriveActionStatus(a, discharged, today)
    return status === a.status ? a : { ...a, status }
  })
}

/** Actions with at least one accepted item filed against them. */
function dischargedActionIds(evidence: EvidenceItem[]): Set<string> {
  return new Set(evidence.filter(e => e.verdict === 'accepted').map(e => e.actionId))
}

/**
 * Evidence that still blocks something: rejected or undecided, against an
 * action nothing accepted has landed on yet.
 *
 * Once accepted evidence arrives for the same action, the earlier item is
 * history rather than an outstanding problem. It stays visible in the table
 * marked superseded, so clearing a flag never rewrites the trail — but it stops
 * being counted, because a stage that reads amber with nothing left to do about
 * it is the demo asking for work that has already been done.
 */
export function unresolvedEvidence(evidence: EvidenceItem[]): EvidenceItem[] {
  const discharged = dischargedActionIds(evidence)
  return evidence.filter(e => e.verdict !== 'accepted' && !discharged.has(e.actionId))
}

/**
 * Stages 4, 5 and 6 — the three an operator can actually move.
 *
 * Split out from buildStages because they have to be re-derived every time
 * someone approves, returns or files something. See recomputeVesselRun.
 */
function buildOperatorStages(
  actions: ComplianceAction[],
  evidence: EvidenceItem[],
  approvals: ApprovalItem[],
): StageResult[] {
  const doneActions = actions.filter(a => a.status === 'done').length
  const overdueActions = actions.filter(a => a.status === 'overdue').length
  const accepted = evidence.filter(e => e.verdict === 'accepted').length
  const unresolved = unresolvedEvidence(evidence)
  const rejected = unresolved.filter(e => e.verdict === 'rejected').length
  const pendingEvidence = unresolved.filter(e => e.verdict === 'pending').length
  const awaiting = approvals.filter(a => a.state === 'awaiting').length
  const approved = approvals.filter(a => a.state === 'approved').length
  const returned = approvals.filter(a => a.state === 'returned').length

  const stage4: StageStatus =
    actions.length === 0 ? 'pending'
    : overdueActions > 0 ? 'needs-review'
    : doneActions === actions.length ? 'complete'
    : 'active'

  const stage5: StageStatus =
    evidence.length === 0 ? 'pending'
    : rejected > 0 ? 'needs-review'
    : pendingEvidence > 0 ? 'active'
    : 'complete'

  const stage6: StageStatus =
    approvals.length === 0 ? 'pending'
    : returned > 0 ? 'needs-review'
    : awaiting > 0 ? 'active'
    : 'complete'

  return [
    {
      id: 4,
      status: stage4,
      summary:
        actions.length === 0 ? 'Action generation has not run for this hull.'
        : overdueActions > 0 ?
          `${doneActions} of ${actions.length} actions complete. ${overdueActions} past their due date.`
        : `${doneActions} of ${actions.length} actions complete.`,
      count: doneActions,
      countLabel: `of ${actions.length} actions done`,
    },
    {
      id: 5,
      status: stage5,
      summary:
        evidence.length === 0 ? 'No evidence submitted against this hull\'s actions yet.'
        : rejected > 0 ?
          `${accepted} items accepted, ${rejected} rejected and awaiting resubmission.`
        : `${accepted} of ${evidence.length} items accepted.`,
      count: rejected > 0 ? rejected : accepted,
      countLabel: rejected > 0 ? 'items flagged' : 'items accepted',
    },
    {
      id: 6,
      status: stage6,
      summary:
        approvals.length === 0 ? 'Nothing has reached the DPA queue yet.'
        : returned > 0 ? `${returned} items returned to the vessel. ${awaiting} still awaiting sign-off.`
        : awaiting > 0 ? `${awaiting} items awaiting DPA sign-off. Every one needs a human decision.`
        : `All ${approved} items approved. Compliance cycle closed.`,
      count: awaiting > 0 ? awaiting : approved,
      countLabel: awaiting > 0 ? 'awaiting DPA' : 'approved',
    },
  ]
}

/**
 * Derive the six stage rows for one hull from what the agents actually produced.
 *
 * Every status here is read off the data. Nothing is asserted.
 */
export function buildStages(p: VesselParts): StageResult[] {
  return [
    {
      id: 1,
      status: 'complete',
      summary: `${p.recordsIndexed} corpus records indexed. ${p.applicableRecordCount} apply to this hull on flag, type, tonnage, fuel and trading area.`,
      count: p.recordsIndexed,
      countLabel: 'records indexed',
    },
    {
      id: 2,
      status: p.requirements.length > 0 ? 'complete' : 'pending',
      summary:
        p.requirements.length > 0 ?
          `${p.requirements.length} discrete obligations extracted, each traced to a corpus record.`
        : 'Requirement extraction has not run for this hull.',
      count: p.requirements.length,
      countLabel: 'requirements extracted',
    },
    {
      id: 3,
      status: p.assignmentSummary ? 'complete' : 'pending',
      summary: p.assignmentSummary || 'Vessel assignment has not run for this hull.',
      count: p.requirements.length,
      countLabel: 'requirements assigned',
    },
    ...buildOperatorStages(p.actions, p.evidence, p.approvals),
  ]
}

export function buildVesselRun(p: VesselParts): VesselRun {
  const actions = deriveActionStatuses(p.actions, p.evidence)
  const stages = buildStages({ ...p, actions })
  return {
    vesselId: p.vessel.id,
    overallStatus: worstOf(stages.map(s => s.status)),
    stages,
    requirements: p.requirements,
    actions,
    evidence: p.evidence,
    approvals: p.approvals,
  }
}

/**
 * Re-derive everything an operator's actions can change, from the run as it
 * stands right now.
 *
 * A seeded run is a snapshot of one moment. The instant somebody approves an
 * item, returns one, or files a document, the facts the stage rows were read
 * off have moved, and a row that is still showing the old reading is the demo
 * flagging a problem the operator has already fixed. That is what made stage 4
 * feel like a dead end: it said "needs review" and nothing you did could clear
 * it.
 *
 * Stages 1 to 3 are passed through untouched. Nothing available in the demo
 * changes the corpus, the obligations pulled out of it, or which hull they
 * landed on, so re-deriving them would be busywork.
 */
export function recomputeVesselRun(run: VesselRun): VesselRun {
  const actions = deriveActionStatuses(run.actions, run.evidence)
  const stages = [
    ...run.stages.filter(s => s.id <= 3),
    ...buildOperatorStages(actions, run.evidence, run.approvals),
  ]
  return { ...run, actions, stages, overallStatus: worstOf(stages.map(s => s.status)) }
}

/**
 * The agent event log.
 *
 * Derived from what the run produced rather than written by a model, so every
 * line in the feed corresponds to something that actually happened and can be
 * clicked through to. Ordered newest first.
 */
export function buildEvents(vessel: Vessel, run: VesselRun, at: Date): AgentEvent[] {
  const events: AgentEvent[] = []
  let tick = 0
  const stamp = () => new Date(at.getTime() - tick++ * 60_000).toISOString()

  for (const e of run.evidence) {
    if (e.verdict === 'rejected') {
      events.push({
        at: stamp(),
        vesselId: vessel.id,
        vesselName: vessel.name,
        stage: 'Evidence',
        message: `${e.label} rejected — ${e.reason}`,
        type: 'warning',
      })
    }
  }

  for (const a of run.actions) {
    if (a.status === 'overdue') {
      events.push({
        at: stamp(),
        vesselId: vessel.id,
        vesselName: vessel.name,
        stage: 'Actions',
        message: `Overdue since ${a.due} — ${a.action}`,
        type: 'warning',
      })
    }
  }

  const awaiting = run.approvals.filter(a => a.state === 'awaiting').length
  if (awaiting > 0) {
    events.push({
      at: stamp(),
      vesselId: vessel.id,
      vesselName: vessel.name,
      stage: 'Approval',
      message: `${awaiting} items routed to the DPA queue for sign-off`,
      type: 'info',
    })
  }

  if (run.overallStatus === 'complete') {
    events.push({
      at: stamp(),
      vesselId: vessel.id,
      vesselName: vessel.name,
      stage: 'Approval',
      message: 'Compliance cycle closed — every action approved',
      type: 'success',
    })
  }

  events.push({
    at: stamp(),
    vesselId: vessel.id,
    vesselName: vessel.name,
    stage: 'Extraction',
    message: `${run.requirements.length} obligations extracted and assigned to this hull`,
    type: 'info',
  })

  return events
}
