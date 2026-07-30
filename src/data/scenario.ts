// ═══════════════════════════════════════════════════════════════════════════
//  SCENARIO LAYER
//
//  The demo shows two structurally different kinds of row, and the difference
//  is the whole point:
//
//    Real PIL identities  →  APPLICABILITY.  What the regulations require of a
//                            hull with this flag, type and tonnage. Derivable
//                            from published facts. Not a claim about anything
//                            PIL has or hasn't done.
//
//    Scenario vessels     →  EXECUTION.  What happened: actions closed, evidence
//                            rejected, findings raised, approvals signed. All
//                            invented, so it may only ever attach to a hull that
//                            is itself invented.
//
//  The line that matters: "78 requirements apply to this vessel" is a statement
//  about the rulebook. "3 evidence items rejected" is an allegation about an
//  operator. The first is safe on a real name, the second never is.
//
//  Scenario vessels reuse the marketing site's existing demonstration fleet
//  (MV Adriatic Pioneer and friends) so the two surfaces tell one story.
// ═══════════════════════════════════════════════════════════════════════════

import type { FleetIdentity } from './pilFleet'

// ── Pipeline definition ──────────────────────────────────────────────────────

export type StageId = 1 | 2 | 3 | 4 | 5 | 6

export const STAGES = [
  { id: 1, label: 'Regulation Scanning', short: 'Scanning' },
  { id: 2, label: 'Requirement Extraction', short: 'Extraction' },
  { id: 3, label: 'Vessel Assignment', short: 'Assignment' },
  { id: 4, label: 'Action Assignment', short: 'Actions' },
  { id: 5, label: 'Evidence Collection', short: 'Evidence' },
  { id: 6, label: 'DPA Approval', short: 'Approval' },
] as const

/** Size of the indexed regulatory corpus. A claim about our own coverage. */
export const REGULATIONS_INDEXED = 2847

// ═══════════════════════════════════════════════════════════════════════════
//  APPLICABILITY — safe to render against a real vessel name
// ═══════════════════════════════════════════════════════════════════════════

export interface Applicability {
  /** Discrete obligations that apply to this vessel profile. */
  requirements: number
  /** Actions those obligations would generate. */
  actions: number
  /** Evidence artefacts those actions would call for. */
  evidenceItems: number
  /** How far a simulated run has progressed. Never a completion claim. */
  stageReached: StageId
  /** Human label for the vessel class, used in copy. */
  classLabel: string
}

/** Obligation count scales with tonnage: more capacity, more applicable rules. */
function requirementCount(teu: number): number {
  if (teu === 0) return 0
  if (teu > 12000) return 84
  if (teu > 8000) return 78
  if (teu > 5000) return 74
  if (teu > 3000) return 69
  if (teu > 1500) return 64
  if (teu > 800) return 61
  return 57
}

function classLabelFor(teu: number): string {
  if (teu === 0) return 'container vessel on order'
  if (teu > 10000) return 'ultra-large container vessel'
  if (teu > 5000) return 'large container vessel'
  if (teu > 2000) return 'mid-size container vessel'
  return 'feeder container vessel'
}

/**
 * Derives what the rulebook asks of a given hull. Deterministic on the vessel's
 * own published attributes, so the same ship always yields the same figures.
 *
 * `stageReached` is a simulated pipeline position spread across the fleet so the
 * demo has visible variety. It carries no verdict: stage 4 of 6 means a run got
 * that far, not that anything passed or failed.
 */
export function applicabilityFor(v: FleetIdentity, idx: number): Applicability {
  const requirements = requirementCount(v.teu)
  const actions = Math.round(requirements * 0.93)

  // Not yet delivered: nothing to run against.
  if (v.teu === 0) {
    return { requirements: 0, actions: 0, evidenceItems: 0, stageReached: 2, classLabel: classLabelFor(v.teu) }
  }

  const stageReached = ((idx % 4) + 3) as StageId // 3..6, deterministic spread
  return {
    requirements,
    actions,
    evidenceItems: Math.round(actions * 0.88),
    stageReached,
    classLabel: classLabelFor(v.teu),
  }
}

/**
 * Per-stage copy for a real hull. Every line is either a statement about the
 * regulatory corpus or a projection of what a run would produce. Nothing here
 * says an action was completed, an item was accepted, or a cycle was closed.
 */
export function applicabilitySummary(stage: StageId, v: FleetIdentity, a: Applicability): string {
  const reached = a.stageReached >= stage
  switch (stage) {
    case 1:
      return `${REGULATIONS_INDEXED.toLocaleString()} instruments indexed, including ${v.flag} flag state requirements and the MoU regimes covering this trade.`
    case 2:
      return a.requirements === 0
        ? 'Requirement extraction runs once the vessel enters service.'
        : `${a.requirements} discrete obligations apply to a ${a.classLabel} on the ${v.flag} register.`
    case 3:
      return a.requirements === 0
        ? 'Assignment pending delivery.'
        : `All ${a.requirements} obligations map to this hull once flag state, tonnage and trading area are applied.`
    case 4:
      return a.actions === 0
        ? 'No actions generated yet.'
        : `${a.actions} compliance actions would be generated: certificates, drills, surveys and record-keeping.`
    case 5:
      return a.evidenceItems === 0
        ? 'No evidence requirements yet.'
        : `${a.evidenceItems} evidence artefacts would be requested against those actions.`
    case 6:
      return reached
        ? 'Completed actions route to the Designated Person Ashore for sign-off before the record is finalised.'
        : 'DPA sign-off is the final gate on every cycle.'
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  EXECUTION — fictional vessels only
// ═══════════════════════════════════════════════════════════════════════════

export type ExecState = 'complete' | 'active' | 'needs-review' | 'pending'

export interface ScenarioStage {
  id: StageId
  state: ExecState
  summary: string
  count: number
  countLabel: string
}

export interface ScenarioVessel {
  id: string
  name: string
  type: string
  flag: string
  year: string
  teu: number
  route: string
  state: ExecState
  stages: ScenarioStage[]
}

interface ScenarioSpec {
  id: string
  name: string
  type: string
  flag: string
  year: string
  teu: number
  route: string
  state: ExecState
}

/**
 * Invented hulls. These carry every operational record in the demo, which is
 * exactly why none of them may resemble a real vessel or operator.
 */
const SCENARIO_SPECS: ScenarioSpec[] = [
  { id: 's1', name: 'MV Adriatic Pioneer', type: 'Bulk Carrier', flag: 'Malta', year: '2016', teu: 0, route: 'Rotterdam → Antwerp', state: 'complete' },
  { id: 's2', name: 'MV Pacific Endeavour', type: 'Container', flag: 'Panama', year: '2014', teu: 8540, route: 'Singapore → Jebel Ali', state: 'active' },
  { id: 's3', name: 'MV Nordic Resolve', type: 'Tanker', flag: 'Norway', year: '2011', teu: 0, route: 'Hamburg → Gothenburg', state: 'needs-review' },
  { id: 's4', name: 'MV Strait Albatross', type: 'Bulk Carrier', flag: 'Liberia', year: '2019', teu: 0, route: 'Antwerp → Algeciras', state: 'complete' },
  { id: 's5', name: 'MV Coral Meridian', type: 'Container', flag: 'Bahamas', year: '2020', teu: 4300, route: 'Dubai → Karachi', state: 'active' },
]

function scenarioStages(spec: ScenarioSpec, idx: number): ScenarioStage[] {
  const rq = spec.teu > 0 ? requirementCount(spec.teu) : 71
  const ac = Math.round(rq * 0.93)
  const done = Math.round(ac * (0.6 + (idx % 5) * 0.05))
  const evDone = Math.round(done * 0.88)
  const queued = Math.max(1, Math.round((ac - done) * 0.7))
  const flagged = Math.max(2, Math.round(ac * 0.05))
  const S = (id: StageId, state: ExecState, summary: string, count: number, countLabel: string): ScenarioStage =>
    ({ id, state, summary, count, countLabel })

  const scanned = S(1, 'complete', `${REGULATIONS_INDEXED.toLocaleString()} regulations indexed. ${spec.flag} flag requirements current.`, REGULATIONS_INDEXED, 'regulations scanned')
  const extracted = S(2, 'complete', `${rq} discrete obligations extracted for this vessel profile.`, rq, 'requirements extracted')

  if (spec.state === 'complete') {
    return [
      scanned,
      extracted,
      S(3, 'complete', `All ${rq} requirements assigned. Flag state and trading area rules factored in.`, rq, 'requirements assigned'),
      S(4, 'complete', `${ac} compliance actions completed: certificates, drills and record entries all closed.`, ac, 'actions completed'),
      S(5, 'complete', `${ac} evidence items validated and accepted.`, ac, 'items accepted'),
      S(6, 'complete', `DPA approved all ${ac} actions. Nothing outstanding, cycle closed.`, ac, 'actions approved'),
    ]
  }

  if (spec.state === 'active') {
    return [
      scanned,
      extracted,
      S(3, 'complete', `${rq} requirements assigned across the current trading pattern.`, rq, 'requirements assigned'),
      S(4, 'active', `${done} of ${ac} actions closed. ${ac - done} in progress, certificates and drill records pending.`, done, `of ${ac} actions done`),
      S(5, 'active', `${evDone} evidence items accepted. ${done - evDone} still awaited from the vessel.`, evDone, `of ${done} items accepted`),
      S(6, 'active', `${queued} items in the DPA queue, documentation ready for sign-off.`, queued, 'awaiting DPA approval'),
    ]
  }

  // needs-review
  return [
    scanned,
    S(2, 'complete', `${rq} requirements extracted. A recent MoU circular added ${Math.round(rq * 0.04)} new obligations.`, rq, 'requirements extracted'),
    S(3, 'complete', `${rq} requirements assigned on the current profile.`, rq, 'requirements assigned'),
    S(4, 'active', `${done} of ${ac} actions closed. ${flagged} paused pending evidence resubmission.`, done, `of ${ac} actions done`),
    S(5, 'needs-review', `Evidence flagged: ${flagged} items rejected or incomplete. Resubmission required before the next port call.`, flagged, 'items flagged'),
    S(6, 'pending', `Blocked on evidence. The DPA queue opens once ${flagged} items are resolved.`, 0, 'awaiting DPA'),
  ]
}

export const scenarioFleet: ScenarioVessel[] = SCENARIO_SPECS.map((spec, idx) => ({
  ...spec,
  stages: scenarioStages(spec, idx),
}))

// ── Agent activity ───────────────────────────────────────────────────────────

export interface AgentEvent {
  time: string
  vessel: string
  stage: string
  action: string
  type: 'info' | 'warning' | 'success'
}

/**
 * Every row names a scenario vessel. A finding attached to a real hull would be
 * a fabricated allegation about a real operator, so it cannot appear here.
 */
export const agentFeed: AgentEvent[] = [
  { time: '14:29', vessel: 'MV Coral Meridian', stage: 'Evidence', action: 'Bunker delivery notes received, routing to DPA', type: 'info' },
  { time: '14:25', vessel: 'MV Nordic Resolve', stage: 'Evidence', action: 'Fuel oil sample rejected, sulphur mismatch 0.49% against 0.52% declared', type: 'warning' },
  { time: '14:22', vessel: 'MV Pacific Endeavour', stage: 'Actions', action: 'Bunkering log gap detected, escalated as critical', type: 'warning' },
  { time: '14:18', vessel: 'MV Strait Albatross', stage: 'Approval', action: 'DPA approved the compliance cycle, zero deficiencies', type: 'success' },
  { time: '14:15', vessel: 'MV Adriatic Pioneer', stage: 'Evidence', action: '3 crew certificates received, validating', type: 'info' },
]

export interface Notification {
  id: string
  title: string
  vessel: string
  time: string
  type: 'info' | 'warning' | 'success'
}

/** Hoisted out of the component so it isn't rebuilt on every render. */
export const notifications: Notification[] = [
  { id: 'n1', title: 'SEEMP Part III overdue, CII rating period ends in 4 days', vessel: 'MV Nordic Resolve', time: '14:26', type: 'warning' },
  { id: 'n2', title: 'Bunkering log gap, 3 delivery notes missing countersignatures', vessel: 'MV Pacific Endeavour', time: '14:22', type: 'warning' },
  { id: 'n3', title: 'Full compliance cycle closed, all actions approved', vessel: 'MV Strait Albatross', time: '14:18', type: 'success' },
  { id: 'n4', title: 'Evidence resubmission requested from vessel', vessel: 'MV Nordic Resolve', time: '13:58', type: 'info' },
  { id: 'n5', title: 'Annual class survey window opens in 12 days', vessel: 'MV Coral Meridian', time: '13:41', type: 'info' },
  { id: 'n6', title: 'Crew STCW certificates validated', vessel: 'MV Adriatic Pioneer', time: '13:20', type: 'success' },
]

/** Actions processed per hour, for the dashboard sparkline. */
export const actionsPerHour = [
  { h: '08', v: 8 }, { h: '09', v: 21 }, { h: '10', v: 34 },
  { h: '11', v: 19 }, { h: '12', v: 27 }, { h: '13', v: 41 },
  { h: '14', v: 53 },
]

// ── Labels ───────────────────────────────────────────────────────────────────

/**
 * The signed-in operator role. Deliberately a role and not a person: inventing
 * a named employee at a real company is a fabricated person.
 */
export const OPERATOR_ROLE = 'Designated Person Ashore'

/** Shown wherever simulated state appears, so a cropped screenshot still carries it. */
export const SIMULATED_MARKER = 'Simulated'
