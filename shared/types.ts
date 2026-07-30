// ═══════════════════════════════════════════════════════════════════════════
//  SHARED DOMAIN TYPES
//
//  Imported by both the browser bundle (src/) and the Vercel Functions (api/),
//  so this file must stay free of anything that only exists in one of those two
//  environments — no DOM types, no node: imports, no React.
//
//  Lives at the repo root rather than under src/ because the Functions builder
//  resolves imports relative to the file, not through the tsconfig `@/*` alias.
// ═══════════════════════════════════════════════════════════════════════════

export type VesselType =
  | 'Container'
  | 'Bulk Carrier'
  | 'Chemical/Products Tanker'
  | 'LNG-Fuelled Container'

export type FuelType = 'HFO/VLSFO' | 'MGO' | 'LNG dual-fuel'

/** Broad trading pattern. Drives ECA exposure and which MoU inspects the ship. */
export type TradingArea =
  | 'Asia–Europe'
  | 'Intra-Asia'
  | 'Transpacific'
  | 'Middle East–India'

export type StageStatus = 'complete' | 'active' | 'needs-review' | 'pending'

export type Category =
  | 'Safety'
  | 'Environmental'
  | 'Crew'
  | 'Security'
  | 'Labour'
  | 'Technical'

export type EvidenceType =
  | 'Certificate'
  | 'Record book'
  | 'Drill report'
  | 'Survey report'
  | 'Plan'
  | 'Log'
  | 'Analysis report'

/**
 * A hull in the demonstration fleet.
 *
 * Gross tonnage is carried separately from deadweight because the instruments
 * disagree about which one they key off: MARPOL thresholds are gross tonnage,
 * commercial descriptions are deadweight, and container capacity is neither.
 */
export interface Vessel {
  id: string
  name: string
  type: VesselType
  flag: string
  /** IMO number. Invented, but in the correct 7-digit format. */
  imo: string
  built: number
  /** Gross tonnage — what most convention thresholds actually key off. */
  gt: number
  /** Deadweight tonnes. */
  dwt: number
  /** Container capacity, or 0 for vessels not measured in boxes. */
  teu: number
  fuel: FuelType
  tradingArea: TradingArea
  route: string
}

/**
 * Conditions under which a corpus record bites. Every field is optional and
 * absence means "no constraint on this axis" — a record with an empty
 * applicability applies to the whole fleet.
 *
 * Evaluated by `appliesTo()` in corpus.ts before any model call, so the agent
 * reasons over a pre-narrowed set rather than the entire corpus.
 */
export interface Applicability {
  vesselTypes?: VesselType[]
  /** Inclusive floor on gross tonnage. */
  minGrossTonnage?: number
  /** Inclusive ceiling on gross tonnage. */
  maxGrossTonnage?: number
  fuelTypes?: FuelType[]
  tradingAreas?: TradingArea[]
  /** Applies only to hulls delivered before this year (retrofit obligations). */
  builtBefore?: number
  /** Applies only to hulls delivered from this year on. */
  builtFrom?: number
}

/**
 * One entry in the indexed regulatory corpus.
 *
 * These describe real IMO instruments. The `summary` states what the instrument
 * obliges at a level that is accurate; it is not a quotation of regulatory text
 * and must not be relied on as one. See shared/corpus.ts for the disclosure.
 */
export interface CorpusRecord {
  id: string
  instrument: string
  /** Where in the instrument, e.g. 'Chapter III, Regulation 19'. */
  reference: string
  title: string
  summary: string
  category: Category
  evidenceType: EvidenceType
  /** Human-readable cadence: 'Monthly', 'Annual', 'Every 5 years', 'Continuous'. */
  periodicity: string
  applicability: Applicability
  /** ISO date the requirement entered into force. */
  inForce: string
  /**
   * ISO date of the most recent amendment, when there is one. Stage 1 diffs
   * this against the last scan to report what changed.
   */
  amendedAt?: string
}

/** A discrete obligation the extraction agent derived from a corpus record. */
export interface Requirement {
  id: string
  /** The corpus record this traces back to. Never invented. */
  sourceId: string
  obligation: string
  category: Category
  periodicity: string
  evidenceType: EvidenceType
}

/**
 * Three states, each a fact the system can check.
 *
 *   done      accepted evidence exists against this action
 *   overdue   the due date has passed and no accepted evidence exists
 *   open      neither — the work is outstanding and not yet late
 *
 * There used to be an 'in-progress' as well, and the model picked between it
 * and 'open' on nothing at all: whether a crew has started a task is not
 * knowable from a corpus of regulations. Two labels no observer could tell
 * apart is worse than one honest label.
 */
export type ActionStatus = 'done' | 'open' | 'overdue'

/** A dated piece of work generated from an assigned requirement. */
export interface ComplianceAction {
  id: string
  requirementId: string
  action: string
  /** ISO date. */
  due: string
  /** Derived, never model-supplied. See deriveActionStatus in assemble.ts. */
  status: ActionStatus
  evidenceType: EvidenceType
}

export type EvidenceVerdict = 'accepted' | 'rejected' | 'pending'

export interface EvidenceItem {
  id: string
  actionId: string
  label: string
  type: EvidenceType
  verdict: EvidenceVerdict
  /** Why the validator accepted or rejected it. Shown verbatim in the UI. */
  reason: string
  /** Set when a real file was uploaded rather than generated by the agent. */
  uploadedFilename?: string
}

export type ApprovalState = 'awaiting' | 'approved' | 'returned'

/** An item in the DPA's queue. Stage 6 is manual — no model touches this. */
export interface ApprovalItem {
  id: string
  evidenceId: string
  summary: string
  state: ApprovalState
  /** The reviewer's note when an item is returned. */
  note?: string
  /** ISO timestamp of the decision. */
  decidedAt?: string
  /**
   * True when the decision came with the seeded demo fixture rather than from
   * someone clicking Approve in this session. The demo tells the viewer stage 6
   * is the one step no model touches; a fixture that quietly shows items
   * "signed off" by nobody would undercut exactly that claim, so the UI says
   * which is which.
   */
  seeded?: boolean
}

export interface StageResult {
  id: 1 | 2 | 3 | 4 | 5 | 6
  status: StageStatus
  summary: string
  count: number
  countLabel: string
}

/** Everything one agent run produced for one hull. */
export interface VesselRun {
  vesselId: string
  overallStatus: StageStatus
  stages: StageResult[]
  requirements: Requirement[]
  actions: ComplianceAction[]
  evidence: EvidenceItem[]
  approvals: ApprovalItem[]
}

export interface AgentEvent {
  /** ISO timestamp. */
  at: string
  vesselId: string | null
  vesselName: string
  stage: string
  message: string
  type: 'info' | 'warning' | 'success'
}

/** The fleet-wide stage 1 result, which is computed once rather than per hull. */
export interface ScanResult {
  recordsIndexed: number
  instrumentsInForce: string[]
  /** Corpus records amended since the previous scan. */
  changedSince: { id: string; reference: string; amendedAt: string }[]
  summary: string
}

/** A complete run across the whole fleet. This is what gets committed as canonical. */
export interface FleetRun {
  /** ISO timestamp the run completed. */
  completedAt: string
  /** Model that produced it, so a stale canonical file is self-describing. */
  model: string
  scan: ScanResult
  vessels: VesselRun[]
  events: AgentEvent[]
}
