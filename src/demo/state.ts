// ═══════════════════════════════════════════════════════════════════════════
//  DEMO STATE — canonical run underneath, session overlay on top
//
//  Two layers, and the separation is the point:
//
//    CANONICAL  src/data/canonicalRun.json, produced by `npm run seed:agents`
//               and committed. Ships in the bundle, so opening /demo costs
//               nothing and shows a populated fleet immediately. Read-only.
//
//    OVERLAY    Everything this visitor did — approvals, returns, uploads,
//               re-runs. Lives in sessionStorage, keyed per tab. Never writes
//               back to canonical, so one visitor cannot change what the next
//               one sees, and a demo can always be reset to a known state.
//
//  Effective state = canonical, with the overlay applied over it.
//
//  ── On re-runs ────────────────────────────────────────────────────────────
//  Re-running is always a WHOLE HULL, never a single stage. Stage 4 depends on
//  stage 2's requirement ids and stage 5 depends on stage 4's action ids, so
//  re-running one stage in isolation leaves the stages after it pointing at ids
//  that no longer exist. Rather than build an invalidation cascade and get it
//  subtly wrong, a re-run replaces the hull's entire run and drops the approval
//  decisions attached to the evidence it superseded.
// ═══════════════════════════════════════════════════════════════════════════

import { buildApprovals, recomputeVesselRun } from '../../shared/assemble.js'
import type {
  AgentEvent,
  ApprovalState,
  EvidenceItem,
  FleetRun,
  VesselRun,
} from '../../shared/types.js'

export interface Settings {
  dpaEmail: boolean
  agentAlerts: boolean
  weeklyReport: boolean
}

export interface Decision {
  state: ApprovalState
  note?: string
  decidedAt: string
}

export interface Overlay {
  /** Whole-hull re-runs, replacing the canonical entry for that vessel. */
  vessels: Record<string, VesselRun>
  /** DPA decisions, keyed by approval id. */
  decisions: Record<string, Decision>
  /** Evidence added by a real file upload, keyed by vessel id. */
  uploads: Record<string, EvidenceItem[]>
  /** Event keys the operator has marked read. */
  readEvents: string[]
  /** Events produced by live runs in this session. */
  events: AgentEvent[]
  settings: Settings
}

export const DEFAULT_SETTINGS: Settings = {
  dpaEmail: true,
  agentAlerts: true,
  weeklyReport: false,
}

export function emptyOverlay(): Overlay {
  return {
    vessels: {},
    decisions: {},
    uploads: {},
    readEvents: [],
    events: [],
    settings: { ...DEFAULT_SETTINGS },
  }
}

/** Events carry no id of their own, so identity is content-derived. */
export function eventKey(e: AgentEvent): string {
  return `${e.at}|${e.vesselId ?? '-'}|${e.message}`
}

// ── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'matsu.demo.overlay.v1'

export function loadOverlay(): Overlay {
  if (typeof sessionStorage === 'undefined') return emptyOverlay()
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyOverlay()
    const parsed = JSON.parse(raw) as Partial<Overlay>
    // Merge over a fresh overlay so a stored blob from an older shape cannot
    // leave a required key undefined.
    return { ...emptyOverlay(), ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } }
  } catch {
    return emptyOverlay()
  }
}

export function saveOverlay(overlay: Overlay): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(overlay))
  } catch {
    // Quota exceeded, or storage disabled. The demo still works for this page
    // view; it just will not survive a reload. Not worth interrupting anyone.
  }
}

// ── Reducer ──────────────────────────────────────────────────────────────────

export type Action =
  | { type: 'reset' }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'decide'; approvalId: string; state: ApprovalState; note?: string }
  | { type: 'markAllRead'; keys: string[] }
  | { type: 'vesselRun'; run: VesselRun; events: AgentEvent[] }
  | { type: 'upload'; vesselId: string; item: EvidenceItem }

export function reducer(state: Overlay, action: Action): Overlay {
  switch (action.type) {
    case 'reset':
      return emptyOverlay()

    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } }

    case 'decide':
      return {
        ...state,
        decisions: {
          ...state.decisions,
          [action.approvalId]: {
            state: action.state,
            note: action.note,
            decidedAt: new Date().toISOString(),
          },
        },
      }

    case 'markAllRead':
      return { ...state, readEvents: [...new Set([...state.readEvents, ...action.keys])] }

    case 'vesselRun': {
      // A fresh run supersedes this hull's evidence, so decisions and uploads
      // attached to the old evidence no longer refer to anything. Drop them
      // rather than leave orphans that render as ghost approvals.
      const liveApprovalIds = new Set(action.run.approvals.map(a => a.id))
      const decisions = Object.fromEntries(
        Object.entries(state.decisions).filter(([id]) => liveApprovalIds.has(id)),
      )
      const { [action.run.vesselId]: _dropped, ...uploads } = state.uploads

      return {
        ...state,
        vessels: { ...state.vessels, [action.run.vesselId]: action.run },
        decisions,
        uploads,
        events: [...action.events, ...state.events].slice(0, 200),
      }
    }

    case 'upload':
      return {
        ...state,
        uploads: {
          ...state.uploads,
          [action.vesselId]: [...(state.uploads[action.vesselId] ?? []), action.item],
        },
      }

    default:
      return state
  }
}

// ── Projection ───────────────────────────────────────────────────────────────

/**
 * Canonical with the overlay applied. Everything the UI renders comes from
 * here, so there is exactly one place where "what is true right now" is
 * decided and no component can disagree with another about it.
 */
export function project(canonical: FleetRun | null, overlay: Overlay) {
  const vessels: VesselRun[] = (canonical?.vessels ?? []).map(v => {
    const base = overlay.vessels[v.vesselId] ?? v
    const uploaded = overlay.uploads[v.vesselId] ?? []

    const evidence = [...base.evidence, ...uploaded]

    // Rebuild the queue rather than patching the seeded one, so a document
    // uploaded now reaches the DPA the same way a seeded item did. Approval ids
    // are derived from evidence ids, so decisions already taken still match.
    const approvals = buildApprovals(evidence, base.actions).map(a => {
      const decision = overlay.decisions[a.id]
      return decision ?
          { ...a, state: decision.state, note: decision.note, decidedAt: decision.decidedAt }
        : a
    })

    return recomputeVesselRun({ ...base, evidence, approvals })
  })

  // Re-runs produce their own vessel entries; keep any that canonical lacks.
  for (const [id, run] of Object.entries(overlay.vessels)) {
    if (!vessels.some(v => v.vesselId === id)) vessels.push(run)
  }

  const events = [...overlay.events, ...(canonical?.events ?? [])].sort((a, b) =>
    b.at.localeCompare(a.at),
  )

  return {
    scan: canonical?.scan ?? null,
    completedAt: canonical?.completedAt ?? null,
    model: canonical?.model ?? null,
    vessels,
    events,
  }
}

export type Projection = ReturnType<typeof project>
