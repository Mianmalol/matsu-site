// ═══════════════════════════════════════════════════════════════════════════
//  DEMONSTRATION FLEET
//
//  Every vessel and the operator are INVENTED. That is the point: the marketing
//  page is public and indexed, so a roster there reads as a customer list and a
//  status column reads as a factual claim about someone's ships. An invented
//  fleet makes the same product argument and claims nothing about anyone.
//
//  This replaced a roster of 109 real, published Pacific International Lines
//  identities. Those still appear in the gated product demo at /demo, which is
//  behind auth, noindex'd, and labelled as demo data.
//
//  The first five names are also the hulls the fleet map plots, keyed by id in
//  components/mapGeo.ts via `vessels` in ../data.ts. Keep the names in step so
//  the roster and the map describe one fleet.
// ═══════════════════════════════════════════════════════════════════════════

/** Size of the indexed regulatory corpus. A claim about our own coverage. */
export const REGULATIONS_INDEXED = 2847

/** The invented carrier the demonstration fleet belongs to. */
export const DEMO_OPERATOR = 'Meridian Line'

export interface DemoVessel {
  name: string
  type: string
  /** Flag state, spelled out. */
  flag: string
  year: number
  /** Deadweight tonnes. Every ship has one, so obligations derive from this. */
  dwt: number
  /** Container capacity, or 0 for vessels not measured in boxes. */
  teu: number
}

export const demoFleet: DemoVessel[] = [
  { name: 'MV Adriatic Pioneer',  type: 'Bulk Carrier', flag: 'Malta',            year: 2016, dwt: 82000,  teu: 0 },
  { name: 'MV Pacific Endeavour', type: 'Container',    flag: 'Panama',           year: 2014, dwt: 103000, teu: 8540 },
  { name: 'MV Nordic Resolve',    type: 'Tanker',       flag: 'Norway',           year: 2011, dwt: 74000,  teu: 0 },
  { name: 'MV Strait Albatross',  type: 'Bulk Carrier', flag: 'Liberia',          year: 2019, dwt: 63000,  teu: 0 },
  { name: 'MV Coral Meridian',    type: 'Container',    flag: 'Bahamas',          year: 2020, dwt: 52000,  teu: 4300 },
  { name: 'MV Aurora Straits',    type: 'Container',    flag: 'Marshall Islands', year: 2023, dwt: 165000, teu: 14200 },
  { name: 'MV Kestrel Bay',       type: 'Container',    flag: 'Singapore',        year: 2021, dwt: 141000, teu: 11900 },
  { name: 'MV Talisman Reach',    type: 'Container',    flag: 'Panama',           year: 2022, dwt: 88000,  teu: 7092 },
  { name: 'MV Sable Horizon',     type: 'Tanker',       flag: 'Malta',            year: 2013, dwt: 47000,  teu: 0 },
  { name: 'MV Cygnus Trader',     type: 'Bulk Carrier', flag: 'Cyprus',           year: 2009, dwt: 33000,  teu: 0 },
  { name: 'MV Harbour Lantern',   type: 'Container',    flag: 'Singapore',        year: 2018, dwt: 24000,  teu: 1810 },
  { name: 'MV Windward Petrel',   type: 'Container',    flag: 'Liberia',          year: 2007, dwt: 11000,  teu: 628 },
]

export const FLEET_COUNT = demoFleet.length

/** How the roster prints a vessel's size: boxes where that's the measure, tonnes otherwise. */
export function capacityLabel(v: DemoVessel): string {
  return v.teu > 0 ? `${v.teu.toLocaleString()} TEU` : `${v.dwt.toLocaleString()} DWT`
}

export type StageId = 1 | 2 | 3 | 4 | 5 | 6

export interface Applicability {
  /** Discrete obligations that apply to this vessel profile. */
  requirements: number
  /** Actions those obligations would generate. */
  actions: number
  /** How far a simulated run has progressed. Never a completion claim. */
  stageReached: StageId
}

/** Obligation count scales with size: more tonnage, more applicable rules. */
function requirementCount(dwt: number): number {
  if (dwt > 150000) return 84
  if (dwt > 100000) return 78
  if (dwt > 60000) return 74
  if (dwt > 30000) return 69
  if (dwt > 15000) return 64
  if (dwt > 5000) return 61
  return 57
}

/**
 * What the rulebook asks of a given hull. Deterministic on the vessel's own
 * attributes, so the same ship always yields the same figures.
 *
 * `stageReached` is a pipeline position spread across the fleet so the roster
 * has visible variety. It carries no verdict: stage 4 of 6 means a run got that
 * far, not that anything passed or failed.
 */
export function applicabilityFor(v: DemoVessel, idx: number): Applicability {
  const requirements = requirementCount(v.dwt)
  return {
    requirements,
    actions: Math.round(requirements * 0.93),
    stageReached: ((idx % 4) + 3) as StageId, // 3..6, deterministic spread
  }
}
