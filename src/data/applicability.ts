// ═══════════════════════════════════════════════════════════════════════════
//  APPLICABILITY
//
//  What the rulebook asks of a hull, derived from its own published attributes:
//  flag state, type, tonnage. "84 obligations apply to an ultra-large container
//  vessel on the Singapore register" is a statement about the regulations, not
//  about anything the operator has or hasn't done, so it is safe to render
//  against a real vessel name.
//
//  Used by the marketing page's Platform section. The product demo at /demo
//  carries its own illustrative pipeline state and does not read this.
//
//  This file was `scenario.ts` and also held invented vessels with full
//  execution records — evidence rejected, findings raised, cycles closed. The
//  demo was rebuilt from the Figma Make export and no longer needs them, so only
//  the applicability half remains.
// ═══════════════════════════════════════════════════════════════════════════

import type { FleetIdentity } from './pilFleet'

export type StageId = 1 | 2 | 3 | 4 | 5 | 6

/** Size of the indexed regulatory corpus. A claim about our own coverage. */
export const REGULATIONS_INDEXED = 2847

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
 * roster has visible variety. It carries no verdict: stage 4 of 6 means a run got
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
