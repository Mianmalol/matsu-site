// ═══════════════════════════════════════════════════════════════════════════
//  CONTACT
//  Single source of truth for every mailto on the site. Harbor and the footer
//  used to disagree about this by accident; one constant so they can't again.
// ═══════════════════════════════════════════════════════════════════════════
export const CONTACT_EMAIL = 'marco0111ml@gmail.com'

/** Prefilled subject for demo requests, so they're filterable on arrival. */
export const DEMO_MAILTO = `mailto:${CONTACT_EMAIL}?subject=Matsu%20demo%20request`

// ═══════════════════════════════════════════════════════════════════════════
//  PHOTOGRAPHY SLOTS
//  Drop licensed maritime photo URLs here (blue hour, overcast, industrial).
//  When a URL is set, it renders behind the section's vector scene with a
//  navy exposure wash so typography stays legible. Leave '' to use the
//  coded scene alone.
// ═══════════════════════════════════════════════════════════════════════════
export const IMAGES = {
  hero: '',        // open ocean, cargo vessel, slightly off-center, morning light
  bridge: '',      // ship bridge, panoramic windows
  deck: '',        // cargo deck, containers, steel
  engine: '',      // engine room, gauges, controlled lighting
  docs: '',        // documentation workspace
  port: '',        // dusk port arrival, cranes
  harbor: '',      // final harbor at dawn
}

// ═══════════════════════════════════════════════════════════════════════════
//  Data
// ═══════════════════════════════════════════════════════════════════════════

export interface Vessel {
  id: string; name: string; type: string; flag: string; imo: string
  score: number; expiring: number; actions: number; port: string
  status: 'compliant' | 'attention' | 'risk'
}

// Chart positions/routes for these vessels live in components/mapGeo.ts (keyed by id).
//
// These five hulls are INVENTED. That is what lets them carry execution state:
// compliance status, deficiencies, expiring certificates, PSC risk. The real PIL
// fleet in data/pilFleet.ts may never carry any of it — see the header comment
// there. If you add a real vessel to this array, that guarantee breaks.
export const vessels: Vessel[] = [
  { id: '1', name: 'MV Adriatic Pioneer', type: 'Bulk Carrier', flag: 'MT', imo: '9876543', score: 96, expiring: 1, actions: 0, port: 'Rotterdam', status: 'compliant' },
  { id: '2', name: 'MV Pacific Endeavour', type: 'Container', flag: 'PA', imo: '9654321', score: 81, expiring: 4, actions: 2, port: 'Singapore', status: 'attention' },
  { id: '3', name: 'MV Nordic Resolve', type: 'Tanker', flag: 'NO', imo: '9432109', score: 62, expiring: 6, actions: 5, port: 'Hamburg', status: 'risk' },
  { id: '4', name: 'MV Strait Albatross', type: 'Bulk Carrier', flag: 'LR', imo: '9210987', score: 98, expiring: 0, actions: 0, port: 'Antwerp', status: 'compliant' },
  { id: '5', name: 'MV Coral Meridian', type: 'Container', flag: 'BS', imo: '9109876', score: 87, expiring: 2, actions: 1, port: 'Dubai', status: 'attention' },
]

export const floatingDocs = [
  { title: 'Safety Management Certificate', meta: 'Expires in 21 days' },
  { title: 'PSC Inspection · Paris MOU', meta: '2 open deficiencies' },
  { title: 'ISM Internal Audit', meta: 'Finding NC-014 unresolved' },
  { title: 'Crew STCW Certification', meta: '3 renewals due' },
  { title: 'MARPOL IOPP Certificate', meta: 'Survey window open' },
  { title: 'Annual Class Survey', meta: 'Evidence incomplete' },
  { title: 'Flag State Circular 04/26', meta: 'Applicability unreviewed' },
  { title: 'CII Trajectory', meta: 'Rating at risk: band D' },
]

export const scatter = [
  { x: -36, y: -34, r: -8 }, { x: 24, y: -42, r: 6 }, { x: -14, y: -8, r: -3 }, { x: 38, y: -12, r: 9 },
  { x: -42, y: 16, r: 5 }, { x: 10, y: 24, r: -7 }, { x: -20, y: 42, r: 4 }, { x: 34, y: 34, r: -5 },
]

export const scenes = [
  {
    key: 'bridge', kicker: 'The bridge',
    title: 'Fleet-wide visibility from one command center.',
    copy: 'Monitor vessel status, compliance posture, upcoming expirations, inspection readiness, and operational risk across the entire fleet.',
    photo: IMAGES.bridge,
  },
  {
    key: 'deck', kicker: 'The deck',
    title: 'Operational compliance connected to the real vessel.',
    copy: 'Assign actions, track evidence, manage corrective work, and connect compliance requirements directly to vessel operations.',
    photo: IMAGES.deck,
  },
  {
    key: 'engine', kicker: 'The engine room',
    title: 'Every requirement. Every action. Fully traceable.',
    copy: 'Maintain a complete operational record of inspections, findings, corrective actions, approvals, and supporting evidence.',
    photo: IMAGES.engine,
  },
  {
    key: 'docs', kicker: 'Documentation',
    title: 'Documentation that is always inspection-ready.',
    copy: 'Automatically organize certificates, track validity, surface missing evidence, and prepare vessels for audits and port-state control.',
    photo: IMAGES.docs,
  },
  {
    key: 'port', kicker: 'Port arrival',
    title: 'Arrive prepared.',
    copy: 'Identify compliance gaps before arrival, reduce inspection risk, and give shore teams and onboard crews a shared operational picture.',
    photo: IMAGES.port,
  },
]

export const workflow = [
  { step: 'Regulation', example: 'SOLAS Ch. IX / ISM Code' },
  { step: 'Requirement', example: 'SMS internal audit, annual' },
  { step: 'Vessel', example: 'MV Nordic Resolve' },
  { step: 'Assigned action', example: 'Audit + close NC-014' },
  { step: 'Evidence', example: 'Report, photos, records' },
  { step: 'Approval', example: 'DPA sign-off' },
]

export const regs = [
  { name: 'IMO', desc: 'Conventions, circulars, and MEPC / MSC resolutions, tracked at the source.' },
  { name: 'SOLAS', desc: 'Safety of life at sea: construction, equipment, and operational chapters.' },
  { name: 'MARPOL', desc: 'All six annexes, including Annex VI air emissions and EEXI / CII.' },
  { name: 'ISM Code', desc: 'Safety management systems, audits, and non-conformity handling.' },
  { name: 'ISPS Code', desc: 'Ship and port facility security assessments and plans.' },
  { name: 'MLC 2006', desc: 'Maritime labour conditions, certification, and inspections.' },
  { name: 'Flag states', desc: 'Requirement libraries and circulars for 65+ registries.' },
  { name: 'Port-state control', desc: 'Paris MOU, Tokyo MOU, and USCG inspection regimes and CIC campaigns.' },
  { name: 'Class societies', desc: 'Survey schedules and unified IACS requirements.' },
  { name: 'Regional rules', desc: 'EU MRV, EU ETS, FuelEU Maritime, and emission control areas.' },
]

export const security = [
  'Role-based access control', 'Immutable audit history', 'Document version control',
  'Evidence traceability', 'Approval workflows', 'Multi-vessel permissions',
  'Enterprise authentication (SSO)', 'Secure document storage', 'Data export and regulatory reporting',
]
