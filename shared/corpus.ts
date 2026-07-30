// ═══════════════════════════════════════════════════════════════════════════
//  INDEXED REGULATORY CORPUS
//
//  ── What this is ──────────────────────────────────────────────────────────
//  Structured records describing REAL IMO instruments and the obligations they
//  impose. This is the source stage 1 indexes and stage 2 extracts from. It is
//  what makes the agents do work rather than invent it: a requirement that does
//  not trace to a record in here is rejected before it reaches the UI.
//
//  ── What this is NOT ──────────────────────────────────────────────────────
//  Not regulatory text. Every `summary` is a plain-language description of what
//  the instrument requires, written for this repo. Nothing here is quoted from
//  IMO publications, which are copyrighted and not ours to redistribute. It
//  follows that these summaries are not authoritative, may be incomplete, and
//  must not be used to determine any real vessel's compliance position.
//
//  ── Currency ──────────────────────────────────────────────────────────────
//  CORPUS_VERSION and CURRENT_THROUGH below are what the demo displays. A
//  static corpus cannot know what changed in the world since it was written,
//  only what changed between its own versions — stage 1 is worded to say that
//  and must stay worded that way.
//
//  ── Adding records ────────────────────────────────────────────────────────
//  Applicability is evaluated by `appliesTo()` in deterministic code, never by
//  the model. If a rule bites on a fact the Vessel type does not carry, add the
//  fact to Vessel first. Do not approximate it in prose and hope the model
//  infers it.
// ═══════════════════════════════════════════════════════════════════════════

import type { CorpusRecord, Vessel } from './types.js'

/** Bumped whenever records change. Committed runs record the version they used. */
export const CORPUS_VERSION = '2026.07.1'

/** The date this corpus was last reviewed against published sources. */
export const CURRENT_THROUGH = '2026-07-30'

/** The previous version's date, so stage 1 has a baseline to diff against. */
export const PREVIOUS_SCAN = '2026-04-15'

export const CORPUS: CorpusRecord[] = [
  // ── SOLAS ────────────────────────────────────────────────────────────────
  {
    id: 'SOLAS-I-07',
    instrument: 'SOLAS 1974 (as amended)',
    reference: 'Chapter I, Regulations 7–10',
    title: 'Statutory surveys and certification',
    summary:
      'Cargo ships must hold valid Safety Construction, Safety Equipment and Safety Radio certificates, maintained through a survey cycle of annual, intermediate and renewal surveys. Certificates lapse if the survey window is missed.',
    category: 'Safety',
    evidenceType: 'Certificate',
    periodicity: 'Annual, with renewal every 5 years',
    applicability: { minGrossTonnage: 500 },
    inForce: '1980-05-25',
  },
  {
    id: 'SOLAS-II-1-G',
    instrument: 'SOLAS 1974 (as amended) / IGF Code',
    reference: 'Chapter II-1, Part G',
    title: 'Ships using gases or other low-flashpoint fuels',
    summary:
      'Ships using low-flashpoint fuel must meet the IGF Code: an approved fuel handling arrangement, documented bunkering procedures, gas detection and shutdown systems, and crew trained specifically for the fuel in use.',
    category: 'Technical',
    evidenceType: 'Certificate',
    periodicity: 'Annual, with renewal every 5 years',
    applicability: { fuelTypes: ['LNG dual-fuel'] },
    inForce: '2017-01-01',
    amendedAt: '2026-01-01',
  },
  {
    id: 'SOLAS-II-2-10',
    instrument: 'SOLAS 1974 (as amended)',
    reference: 'Chapter II-2, Regulation 10',
    title: 'Fire fighting equipment and systems',
    summary:
      'Fire mains, pumps, hydrants, hoses and portable extinguishers must be provided to the standard set for the ship type and tonnage, and kept ready for immediate use.',
    category: 'Safety',
    evidenceType: 'Survey report',
    periodicity: 'Annual',
    applicability: {},
    inForce: '1980-05-25',
  },
  {
    id: 'SOLAS-II-2-14',
    instrument: 'SOLAS 1974 (as amended)',
    reference: 'Chapter II-2, Regulation 14',
    title: 'Operational readiness and maintenance of fire safety systems',
    summary:
      'Fire protection and detection systems must be maintained under a documented plan, tested at the intervals the system requires, and kept in working order between surveys.',
    category: 'Safety',
    evidenceType: 'Log',
    periodicity: 'Continuous, with scheduled tests',
    applicability: {},
    inForce: '2002-07-01',
  },
  {
    id: 'SOLAS-III-19',
    instrument: 'SOLAS 1974 (as amended)',
    reference: 'Chapter III, Regulation 19',
    title: 'Emergency training and drills',
    summary:
      'Every crew member takes part in an abandon ship drill and a fire drill each month. Where more than a quarter of the crew has changed, drills must be held within 24 hours of leaving port.',
    category: 'Safety',
    evidenceType: 'Drill report',
    periodicity: 'Monthly',
    applicability: {},
    inForce: '1980-05-25',
  },
  {
    id: 'SOLAS-III-20',
    instrument: 'SOLAS 1974 (as amended)',
    reference: 'Chapter III, Regulation 20',
    title: 'Readiness and inspection of life-saving appliances',
    summary:
      'Life-saving appliances are inspected weekly and monthly, lifeboat engines run regularly, and davit-launched liferaft arrangements and release gear serviced on the intervals set for them.',
    category: 'Safety',
    evidenceType: 'Log',
    periodicity: 'Weekly and monthly',
    applicability: {},
    inForce: '1980-05-25',
  },
  {
    id: 'SOLAS-IV-15',
    instrument: 'SOLAS 1974 (as amended)',
    reference: 'Chapter IV, Regulation 15',
    title: 'GMDSS radio equipment and maintenance',
    summary:
      'Radio installations for the sea areas the ship trades in must be maintained available, with duplication, shore maintenance or at-sea capability providing the required redundancy.',
    category: 'Safety',
    evidenceType: 'Certificate',
    periodicity: 'Annual',
    applicability: { minGrossTonnage: 300 },
    inForce: '1992-02-01',
  },
  {
    id: 'SOLAS-V-19',
    instrument: 'SOLAS 1974 (as amended)',
    reference: 'Chapter V, Regulation 19',
    title: 'Carriage requirements for navigational systems',
    summary:
      'Prescribed navigational equipment must be carried and operational, including ECDIS, AIS, a voyage data recorder, and bridge navigational watch alarm arrangements, scaled to the ship type and tonnage.',
    category: 'Safety',
    evidenceType: 'Survey report',
    periodicity: 'Annual',
    applicability: { minGrossTonnage: 3_000 },
    inForce: '2002-07-01',
  },
  {
    id: 'SOLAS-V-34',
    instrument: 'SOLAS 1974 (as amended)',
    reference: 'Chapter V, Regulation 34',
    title: 'Voyage planning',
    summary:
      'A berth-to-berth passage plan must be prepared before departure, accounting for routeing measures, under-keel clearance and contingency anchorages.',
    category: 'Safety',
    evidenceType: 'Plan',
    periodicity: 'Every voyage',
    applicability: {},
    inForce: '2002-07-01',
  },
  {
    id: 'SOLAS-IX-03',
    instrument: 'SOLAS 1974 (as amended) / ISM Code',
    reference: 'Chapter IX, Regulation 3',
    title: 'Safety management system',
    summary:
      'The company operates a safety management system certified by a Document of Compliance, and each ship holds a Safety Management Certificate. Internal audits, management review and documented corrective action are part of the system, not optional additions to it.',
    category: 'Safety',
    evidenceType: 'Certificate',
    periodicity: 'Annual audit, renewal every 5 years',
    applicability: {},
    inForce: '1998-07-01',
  },
  {
    id: 'SOLAS-XI-1-05',
    instrument: 'SOLAS 1974 (as amended)',
    reference: 'Chapter XI-1, Regulation 5',
    title: 'Continuous Synopsis Record',
    summary:
      'The ship carries an unbroken record of flag, ownership, class and ISM history. Entries are issued by the flag administration and the record must remain complete across changes.',
    category: 'Technical',
    evidenceType: 'Record book',
    periodicity: 'On change of particulars',
    applicability: { minGrossTonnage: 500 },
    inForce: '2004-07-01',
  },
  {
    id: 'ISPS-A-09',
    instrument: 'SOLAS Chapter XI-2 / ISPS Code',
    reference: 'ISPS Part A, Sections 9 and 13',
    title: 'Ship security plan, officer and drills',
    summary:
      'An approved Ship Security Plan is carried, a Ship Security Officer is designated, and security drills are held at least every three months. A security exercise involving the company takes place at least once each calendar year.',
    category: 'Security',
    evidenceType: 'Drill report',
    periodicity: 'Quarterly drills, annual exercise',
    applicability: { minGrossTonnage: 500 },
    inForce: '2004-07-01',
  },
  {
    id: 'ISPS-A-19',
    instrument: 'SOLAS Chapter XI-2 / ISPS Code',
    reference: 'ISPS Part A, Section 19',
    title: 'International Ship Security Certificate',
    summary:
      'A valid ISSC must be held, supported by an initial, intermediate and renewal verification cycle carried out by the flag administration or a recognised security organisation.',
    category: 'Security',
    evidenceType: 'Certificate',
    periodicity: 'Intermediate verification, renewal every 5 years',
    applicability: { minGrossTonnage: 500 },
    inForce: '2004-07-01',
  },

  // ── MARPOL Annex I — oil ─────────────────────────────────────────────────
  {
    id: 'MARPOL-I-06',
    instrument: 'MARPOL 73/78 Annex I',
    reference: 'Regulations 6 and 7',
    title: 'IOPP Certificate and survey cycle',
    summary:
      'An International Oil Pollution Prevention certificate is required, kept valid by initial, annual, intermediate and renewal surveys, with the Supplement matching the equipment actually fitted.',
    category: 'Environmental',
    evidenceType: 'Certificate',
    periodicity: 'Annual, renewal every 5 years',
    applicability: { minGrossTonnage: 400 },
    inForce: '1983-10-02',
  },
  {
    id: 'MARPOL-I-14',
    instrument: 'MARPOL 73/78 Annex I',
    reference: 'Regulation 14',
    title: 'Oil filtering equipment',
    summary:
      'Machinery space bilge discharge must pass through oil filtering equipment meeting the 15 ppm standard, with an alarm and automatic stopping arrangement where required by tonnage.',
    category: 'Environmental',
    evidenceType: 'Survey report',
    periodicity: 'Annual',
    applicability: { minGrossTonnage: 400 },
    inForce: '1983-10-02',
  },
  {
    id: 'MARPOL-I-17',
    instrument: 'MARPOL 73/78 Annex I',
    reference: 'Regulation 17',
    title: 'Oil Record Book Part I — machinery space operations',
    summary:
      'Every machinery space oil transfer, bilge discharge, sludge disposal and tank cleaning operation is recorded without delay, signed by the officer in charge and by the master on completion of each page.',
    category: 'Environmental',
    evidenceType: 'Record book',
    periodicity: 'Per operation',
    applicability: { minGrossTonnage: 400 },
    inForce: '1983-10-02',
  },
  {
    id: 'MARPOL-I-36',
    instrument: 'MARPOL 73/78 Annex I',
    reference: 'Regulation 36',
    title: 'Oil Record Book Part II — cargo and ballast operations',
    summary:
      'Oil tankers additionally record cargo loading, internal transfer, discharge, crude oil washing, ballasting and slop tank operations, entry by entry.',
    category: 'Environmental',
    evidenceType: 'Record book',
    periodicity: 'Per operation',
    applicability: { vesselTypes: ['Chemical/Products Tanker'] },
    inForce: '1983-10-02',
  },
  {
    id: 'MARPOL-I-37',
    instrument: 'MARPOL 73/78 Annex I',
    reference: 'Regulation 37',
    title: 'Shipboard Oil Pollution Emergency Plan',
    summary:
      'An approved SOPEP is carried, listing reporting contacts and the immediate actions for a discharge, and the crew is exercised against it.',
    category: 'Environmental',
    evidenceType: 'Plan',
    periodicity: 'Reviewed annually',
    applicability: { minGrossTonnage: 400 },
    inForce: '1993-04-04',
  },

  // ── MARPOL Annex II — noxious liquid substances ──────────────────────────
  {
    id: 'MARPOL-II-09',
    instrument: 'MARPOL 73/78 Annex II',
    reference: 'Regulation 9',
    title: 'NLS Certificate',
    summary:
      'Ships certified to carry noxious liquid substances in bulk hold an International Pollution Prevention Certificate for the Carriage of Noxious Liquid Substances, listing the products the ship is approved for.',
    category: 'Environmental',
    evidenceType: 'Certificate',
    periodicity: 'Annual, renewal every 5 years',
    applicability: { vesselTypes: ['Chemical/Products Tanker'] },
    inForce: '1987-04-06',
  },
  {
    id: 'MARPOL-II-14',
    instrument: 'MARPOL 73/78 Annex II',
    reference: 'Regulation 14',
    title: 'Procedures and Arrangements Manual',
    summary:
      'An approved P&A Manual sets out how cargo residues are handled, tanks prewashed and effluent discharged for each substance category the ship may carry.',
    category: 'Environmental',
    evidenceType: 'Plan',
    periodicity: 'On approval, reviewed on cargo change',
    applicability: { vesselTypes: ['Chemical/Products Tanker'] },
    inForce: '1987-04-06',
  },
  {
    id: 'MARPOL-II-15',
    instrument: 'MARPOL 73/78 Annex II',
    reference: 'Regulation 15',
    title: 'Cargo Record Book',
    summary:
      'Loading, internal transfer, unloading, tank cleaning, prewash, ballasting and discharge operations for noxious liquid substances are each recorded and signed.',
    category: 'Environmental',
    evidenceType: 'Record book',
    periodicity: 'Per operation',
    applicability: { vesselTypes: ['Chemical/Products Tanker'] },
    inForce: '1987-04-06',
  },

  // ── MARPOL Annex IV — sewage ─────────────────────────────────────────────
  {
    id: 'MARPOL-IV-05',
    instrument: 'MARPOL 73/78 Annex IV',
    reference: 'Regulations 4–5',
    title: 'ISPP Certificate and sewage systems',
    summary:
      'An International Sewage Pollution Prevention certificate is held, and the ship carries an approved treatment plant, comminuting and disinfecting system, or holding tank sized for its trade.',
    category: 'Environmental',
    evidenceType: 'Certificate',
    periodicity: 'Renewal every 5 years',
    applicability: { minGrossTonnage: 400 },
    inForce: '2003-09-27',
  },

  // ── MARPOL Annex V — garbage ─────────────────────────────────────────────
  {
    id: 'MARPOL-V-10',
    instrument: 'MARPOL 73/78 Annex V',
    reference: 'Regulation 10',
    title: 'Garbage Management Plan, Record Book and placards',
    summary:
      'A Garbage Management Plan is carried and followed, placards are displayed, and every discharge or incineration is recorded in the Garbage Record Book with date, position, category and estimated amount.',
    category: 'Environmental',
    evidenceType: 'Record book',
    periodicity: 'Per operation',
    applicability: { minGrossTonnage: 400 },
    inForce: '2013-01-01',
    amendedAt: '2026-05-01',
  },

  // ── MARPOL Annex VI — air ────────────────────────────────────────────────
  {
    id: 'MARPOL-VI-06',
    instrument: 'MARPOL 73/78 Annex VI',
    reference: 'Regulations 5–6',
    title: 'IAPP and IEE Certificates',
    summary:
      'An International Air Pollution Prevention certificate is held, and ships subject to the energy efficiency requirements additionally hold an International Energy Efficiency certificate.',
    category: 'Environmental',
    evidenceType: 'Certificate',
    periodicity: 'Annual, renewal every 5 years',
    applicability: { minGrossTonnage: 400 },
    inForce: '2005-05-19',
  },
  {
    id: 'MARPOL-VI-12',
    instrument: 'MARPOL 73/78 Annex VI',
    reference: 'Regulation 12',
    title: 'Ozone depleting substances record',
    summary:
      'Equipment containing ozone depleting substances is listed, and recharges, repairs and discharges to atmosphere are recorded.',
    category: 'Environmental',
    evidenceType: 'Record book',
    periodicity: 'Per operation',
    applicability: { minGrossTonnage: 400 },
    inForce: '2005-05-19',
  },
  {
    id: 'MARPOL-VI-13',
    instrument: 'MARPOL 73/78 Annex VI',
    reference: 'Regulation 13',
    title: 'NOx emission limits for diesel engines',
    summary:
      'Marine diesel engines above 130 kW must hold an EIAPP certificate and a Technical File, and comply with the NOx tier set by the keel-laying date and the areas the ship trades in.',
    category: 'Environmental',
    evidenceType: 'Certificate',
    periodicity: 'Survey-linked',
    applicability: { minGrossTonnage: 400 },
    inForce: '2005-05-19',
  },
  {
    id: 'MARPOL-VI-14',
    instrument: 'MARPOL 73/78 Annex VI',
    reference: 'Regulation 14',
    title: 'Sulphur content of fuel oil',
    summary:
      'Fuel oil sulphur content must not exceed 0.50% by mass globally, or 0.10% inside an Emission Control Area. Where compliance rests on an equivalent arrangement, that arrangement must be approved and operating.',
    category: 'Environmental',
    evidenceType: 'Analysis report',
    periodicity: 'Per bunkering, continuous compliance',
    applicability: { minGrossTonnage: 400 },
    inForce: '2020-01-01',
  },
  {
    id: 'MARPOL-VI-18',
    instrument: 'MARPOL 73/78 Annex VI',
    reference: 'Regulation 18',
    title: 'Bunker Delivery Notes and representative samples',
    summary:
      'A Bunker Delivery Note is retained on board for three years after delivery, and the accompanying MARPOL sample is retained until the fuel is substantially consumed, and in any case no less than twelve months.',
    category: 'Environmental',
    evidenceType: 'Record book',
    periodicity: 'Per bunkering',
    applicability: { minGrossTonnage: 400 },
    inForce: '2005-05-19',
  },
  {
    id: 'MARPOL-VI-22A',
    instrument: 'MARPOL 73/78 Annex VI',
    reference: 'Regulation 27',
    title: 'Fuel oil consumption data collection and reporting',
    summary:
      'Fuel oil consumption, distance travelled and hours under way are collected across the calendar year and reported to the administration, which issues a Statement of Compliance.',
    category: 'Environmental',
    evidenceType: 'Analysis report',
    periodicity: 'Annual',
    applicability: { minGrossTonnage: 5_000 },
    inForce: '2018-03-01',
  },
  {
    id: 'MARPOL-VI-25',
    instrument: 'MARPOL 73/78 Annex VI',
    reference: 'Regulation 25',
    title: 'EEXI — attained index for existing ships',
    summary:
      'Ships delivered before the EEDI regime applies must have an attained Energy Efficiency Existing Ship Index calculated and verified against the required value for their type and size.',
    category: 'Environmental',
    evidenceType: 'Analysis report',
    periodicity: 'One-off verification, revisited on modification',
    applicability: { minGrossTonnage: 400, builtBefore: 2013 },
    inForce: '2023-01-01',
  },
  {
    id: 'MARPOL-VI-26',
    instrument: 'MARPOL 73/78 Annex VI',
    reference: 'Regulation 26',
    title: 'SEEMP Parts I, II and III',
    summary:
      'A Ship Energy Efficiency Management Plan is carried. Ships in scope of the data collection system add Part II, and ships in scope of the carbon intensity regime add Part III with its implementation plan and corrective actions.',
    category: 'Environmental',
    evidenceType: 'Plan',
    periodicity: 'Reviewed annually',
    applicability: { minGrossTonnage: 400 },
    inForce: '2013-01-01',
    amendedAt: '2026-06-12',
  },
  {
    id: 'MARPOL-VI-28',
    instrument: 'MARPOL 73/78 Annex VI',
    reference: 'Regulation 28',
    title: 'Operational carbon intensity rating (CII)',
    summary:
      'Ships in scope calculate an annual operational carbon intensity indicator and receive a rating from A to E. A D rating in three consecutive years, or a single E, triggers a corrective action plan in SEEMP Part III.',
    category: 'Environmental',
    evidenceType: 'Analysis report',
    periodicity: 'Annual',
    applicability: { minGrossTonnage: 5_000 },
    inForce: '2023-01-01',
    amendedAt: '2026-06-12',
  },

  // ── Ballast water ────────────────────────────────────────────────────────
  {
    id: 'BWM-B-01',
    instrument: 'Ballast Water Management Convention 2004',
    reference: 'Regulation B-1',
    title: 'Ballast Water Management Plan',
    summary:
      'An approved plan specific to the ship sets out ballast handling procedures, sediment management, safety precautions and the officer responsible.',
    category: 'Environmental',
    evidenceType: 'Plan',
    periodicity: 'Reviewed on system or trade change',
    applicability: { minGrossTonnage: 400 },
    inForce: '2017-09-08',
  },
  {
    id: 'BWM-B-02',
    instrument: 'Ballast Water Management Convention 2004',
    reference: 'Regulation B-2',
    title: 'Ballast Water Record Book',
    summary:
      'Ballast uptake, circulation, treatment, discharge to reception facilities and accidental discharge are each recorded, with the entries signed by the officer in charge.',
    category: 'Environmental',
    evidenceType: 'Record book',
    periodicity: 'Per operation',
    applicability: { minGrossTonnage: 400 },
    inForce: '2017-09-08',
  },
  {
    id: 'BWM-D-02',
    instrument: 'Ballast Water Management Convention 2004',
    reference: 'Regulation D-2',
    title: 'Ballast water performance standard',
    summary:
      'Discharged ballast must meet the D-2 organism concentration limits, which in practice requires an approved treatment system operated within its stated limitations.',
    category: 'Environmental',
    evidenceType: 'Analysis report',
    periodicity: 'Continuous',
    applicability: { minGrossTonnage: 400 },
    inForce: '2024-09-08',
  },
  {
    id: 'BWM-E-01',
    instrument: 'Ballast Water Management Convention 2004',
    reference: 'Regulation E-1',
    title: 'International Ballast Water Management Certificate',
    summary:
      'A valid IBWMC is held and maintained through the initial, annual, intermediate and renewal survey cycle.',
    category: 'Environmental',
    evidenceType: 'Certificate',
    periodicity: 'Annual, renewal every 5 years',
    applicability: { minGrossTonnage: 400 },
    inForce: '2017-09-08',
  },

  // ── Crew: STCW ───────────────────────────────────────────────────────────
  {
    id: 'STCW-I-04',
    instrument: 'STCW Convention 1978 (as amended)',
    reference: 'Regulation I/4',
    title: 'Certificates of competency and endorsements',
    summary:
      'Every seafarer holds a certificate appropriate to the rank and ship type, endorsed by the flag administration, and valid for the voyage being undertaken.',
    category: 'Crew',
    evidenceType: 'Certificate',
    periodicity: 'Per crew change, revalidated every 5 years',
    applicability: {},
    inForce: '1984-04-28',
  },
  {
    id: 'STCW-I-14',
    instrument: 'STCW Convention 1978 (as amended)',
    reference: 'Regulation I/14',
    title: 'Company responsibilities and familiarisation',
    summary:
      'The company assigns only properly certificated seafarers, and each newly joined seafarer receives documented familiarisation with their safety duties before being assigned them.',
    category: 'Crew',
    evidenceType: 'Record book',
    periodicity: 'Per crew change',
    applicability: {},
    inForce: '1997-02-01',
  },
  {
    id: 'STCW-VI-01',
    instrument: 'STCW Convention 1978 (as amended)',
    reference: 'Regulation VI/1, Section A-VI/1',
    title: 'Basic safety training',
    summary:
      'All seafarers hold basic training in personal survival, fire prevention and fire fighting, elementary first aid, and personal safety and social responsibility, refreshed at the required interval.',
    category: 'Crew',
    evidenceType: 'Certificate',
    periodicity: 'Refreshed every 5 years',
    applicability: {},
    inForce: '1997-02-01',
  },
  {
    id: 'STCW-VIII-01',
    instrument: 'STCW Convention 1978 (as amended)',
    reference: 'Section A-VIII/1',
    title: 'Fitness for duty — hours of rest',
    summary:
      'Watchkeepers receive at least 10 hours of rest in any 24-hour period and 77 hours in any 7-day period. Rest may be split into no more than two periods, one of which is at least 6 hours. Records are maintained and countersigned.',
    category: 'Crew',
    evidenceType: 'Record book',
    periodicity: 'Continuous, recorded monthly',
    applicability: {},
    inForce: '2012-01-01',
  },

  // ── Labour: MLC 2006 ─────────────────────────────────────────────────────
  {
    id: 'MLC-1-2',
    instrument: 'Maritime Labour Convention 2006',
    reference: 'Regulation 1.2',
    title: 'Seafarer medical certificates',
    summary:
      'Each seafarer holds a valid medical certificate attesting fitness for the duties to be performed, issued by an approved practitioner.',
    category: 'Labour',
    evidenceType: 'Certificate',
    periodicity: 'Valid up to 2 years',
    applicability: {},
    inForce: '2013-08-20',
  },
  {
    id: 'MLC-2-1',
    instrument: 'Maritime Labour Convention 2006',
    reference: 'Regulation 2.1',
    title: 'Seafarers employment agreements',
    summary:
      'Each seafarer holds a signed employment agreement, carried on board in English where the ship trades internationally, setting out terms and the notice period.',
    category: 'Labour',
    evidenceType: 'Certificate',
    periodicity: 'Per engagement',
    applicability: {},
    inForce: '2013-08-20',
  },
  {
    id: 'MLC-2-3',
    instrument: 'Maritime Labour Convention 2006',
    reference: 'Standard A2.3',
    title: 'Hours of work and hours of rest records',
    summary:
      'Records of daily hours of work or rest are maintained in a standardised format, endorsed by the master and by the seafarer, with a copy provided to the seafarer.',
    category: 'Labour',
    evidenceType: 'Record book',
    periodicity: 'Monthly',
    applicability: {},
    inForce: '2013-08-20',
  },
  {
    id: 'MLC-2-5',
    instrument: 'Maritime Labour Convention 2006',
    reference: 'Regulation 2.5',
    title: 'Repatriation and financial security',
    summary:
      'A certificate evidencing financial security for repatriation and for abandonment is carried and displayed, naming the provider and the period of cover.',
    category: 'Labour',
    evidenceType: 'Certificate',
    periodicity: 'Annual',
    applicability: {},
    inForce: '2017-01-18',
  },
  {
    id: 'MLC-5-1',
    instrument: 'Maritime Labour Convention 2006',
    reference: 'Regulation 5.1.3',
    title: 'Maritime Labour Certificate and DMLC',
    summary:
      'A Maritime Labour Certificate is held together with a Declaration of Maritime Labour Compliance Parts I and II, kept valid through an intermediate inspection.',
    category: 'Labour',
    evidenceType: 'Certificate',
    periodicity: 'Intermediate inspection, renewal every 5 years',
    applicability: { minGrossTonnage: 500 },
    inForce: '2013-08-20',
  },

  // ── Other conventions ────────────────────────────────────────────────────
  {
    id: 'AFS-2001',
    instrument: 'Anti-fouling Systems Convention 2001',
    reference: 'Annex 4',
    title: 'International Anti-fouling System Certificate',
    summary:
      'An IAFS certificate with a record of the system applied is carried, and the coating in use must be free of the prohibited substances, including the cybutryne restriction.',
    category: 'Environmental',
    evidenceType: 'Certificate',
    periodicity: 'On application or change of system',
    applicability: { minGrossTonnage: 400 },
    inForce: '2008-09-17',
    amendedAt: '2026-01-01',
  },
  {
    id: 'LL-1966',
    instrument: 'International Convention on Load Lines 1966',
    reference: 'Article 16',
    title: 'International Load Line Certificate',
    summary:
      'A load line certificate is held, freeboard marks are maintained legible, and conditions of assignment including closing appliances and freeing ports are kept in order.',
    category: 'Technical',
    evidenceType: 'Certificate',
    periodicity: 'Annual, renewal every 5 years',
    applicability: { minGrossTonnage: 150 },
    inForce: '1968-07-21',
  },
  {
    id: 'TONNAGE-1969',
    instrument: 'International Convention on Tonnage Measurement 1969',
    reference: 'Article 7',
    title: 'International Tonnage Certificate',
    summary:
      'An International Tonnage Certificate (1969) is carried, reissued when the ship undergoes alterations affecting measured tonnage.',
    category: 'Technical',
    evidenceType: 'Certificate',
    periodicity: 'On alteration',
    applicability: { minGrossTonnage: 24 },
    inForce: '1982-07-18',
  },
  {
    id: 'BUNKERS-2001',
    instrument: 'Bunker Oil Pollution Damage Convention 2001',
    reference: 'Article 7',
    title: 'Bunkers civil liability insurance certificate',
    summary:
      'A certificate evidencing insurance or financial security for bunker oil pollution damage is carried on board.',
    category: 'Technical',
    evidenceType: 'Certificate',
    periodicity: 'Annual',
    applicability: { minGrossTonnage: 1_000 },
    inForce: '2008-11-21',
  },
  {
    id: 'NAIROBI-2007',
    instrument: 'Nairobi International Convention on the Removal of Wrecks 2007',
    reference: 'Article 12',
    title: 'Wreck removal insurance certificate',
    summary:
      'A certificate evidencing insurance or other financial security covering liability for wreck removal is carried on board.',
    category: 'Technical',
    evidenceType: 'Certificate',
    periodicity: 'Annual',
    applicability: { minGrossTonnage: 300 },
    inForce: '2015-04-14',
  },
  {
    id: 'HKC-IHM',
    instrument: 'Hong Kong Convention 2009',
    reference: 'Regulation 5',
    title: 'Inventory of Hazardous Materials',
    summary:
      'A Part I inventory of hazardous materials in the ship structure and equipment is maintained and kept current through the ship\'s operational life, supported by an international certificate.',
    category: 'Environmental',
    evidenceType: 'Certificate',
    periodicity: 'Maintained continuously, surveyed every 5 years',
    applicability: { minGrossTonnage: 500 },
    inForce: '2025-06-26',
  },

  // ── Regional and flag-state instruments ──────────────────────────────────
  {
    id: 'EU-MRV',
    instrument: 'EU Regulation 2015/757 (MRV), as amended',
    reference: 'Articles 6 and 11',
    title: 'EU MRV monitoring plan and emissions report',
    summary:
      'Ships calling at ports in the European Economic Area carry an assessed monitoring plan and submit a verified annual emissions report, which underpins the surrender obligation under the EU Emissions Trading System.',
    category: 'Environmental',
    evidenceType: 'Analysis report',
    periodicity: 'Annual',
    applicability: { minGrossTonnage: 5_000, tradingAreas: ['Asia–Europe'] },
    inForce: '2018-01-01',
    amendedAt: '2026-02-20',
  },
  {
    id: 'PARIS-MOU-PSC',
    instrument: 'Paris Memorandum of Understanding on Port State Control',
    reference: 'Section 3, inspection regime',
    title: 'Port state control readiness — Paris MoU',
    summary:
      'Ships trading to the region are selected for inspection by risk profile. Certificates, records and the condition they attest to must withstand inspection without notice, and the current Concentrated Inspection Campaign topic warrants specific preparation.',
    category: 'Safety',
    evidenceType: 'Survey report',
    periodicity: 'Risk-based, campaign topic rotates annually',
    applicability: { tradingAreas: ['Asia–Europe'] },
    inForce: '1982-07-01',
    amendedAt: '2026-07-01',
  },
  {
    id: 'TOKYO-MOU-PSC',
    instrument: 'Tokyo Memorandum of Understanding on Port State Control',
    reference: 'Section 3, inspection regime',
    title: 'Port state control readiness — Tokyo MoU',
    summary:
      'Ships trading in the Asia-Pacific region are selected by risk profile, with the annual Concentrated Inspection Campaign focusing inspection effort on a nominated topic.',
    category: 'Safety',
    evidenceType: 'Survey report',
    periodicity: 'Risk-based, campaign topic rotates annually',
    applicability: { tradingAreas: ['Intra-Asia', 'Transpacific', 'Asia–Europe'] },
    inForce: '1994-04-01',
    amendedAt: '2026-07-01',
  },
  {
    id: 'MPA-SG-CIRCULAR',
    instrument: 'Singapore MPA Shipping Circular',
    reference: 'Flag administration guidance',
    title: 'Singapore flag administration requirements',
    summary:
      'Singapore-flagged ships follow MPA shipping circulars covering survey scheduling, reporting of deficiencies and detentions, and the administration\'s own conditions for certificate endorsement.',
    category: 'Technical',
    evidenceType: 'Record book',
    periodicity: 'As issued',
    applicability: {},
    inForce: '2020-01-01',
    amendedAt: '2026-05-18',
  },
]

/** Fast lookup used to reject any citation the model produces that is not real. */
export const CORPUS_BY_ID: Record<string, CorpusRecord> = Object.fromEntries(
  CORPUS.map(r => [r.id, r]),
)

/**
 * Whether a corpus record bites for a given hull.
 *
 * Deliberately deterministic and deliberately not a model call. Applicability
 * is the part of this pipeline where being wrong is worst and being confident
 * is easiest, so it is decided in code against facts the Vessel actually
 * carries. The model's job starts after this, on records already known to apply.
 *
 * Flag state is intentionally NOT filtered on: every flag record in the corpus
 * describes an administration's general expectations rather than a rule that
 * switches off for other flags, and filtering on it produced a fleet where the
 * two Singapore hulls silently carried an obligation the others did not.
 */
export function appliesTo(record: CorpusRecord, vessel: Vessel): boolean {
  const a = record.applicability

  if (a.vesselTypes && !a.vesselTypes.includes(vessel.type)) return false
  if (a.minGrossTonnage !== undefined && vessel.gt < a.minGrossTonnage) return false
  if (a.maxGrossTonnage !== undefined && vessel.gt > a.maxGrossTonnage) return false
  if (a.fuelTypes && !a.fuelTypes.includes(vessel.fuel)) return false
  if (a.tradingAreas && !a.tradingAreas.includes(vessel.tradingArea)) return false
  if (a.builtBefore !== undefined && vessel.built >= a.builtBefore) return false
  if (a.builtFrom !== undefined && vessel.built < a.builtFrom) return false

  return true
}

/** Every record that bites for a hull. This is the model's working set for stage 2. */
export function applicableRecords(vessel: Vessel): CorpusRecord[] {
  return CORPUS.filter(r => appliesTo(r, vessel))
}

/**
 * Records amended since a given date.
 *
 * This diffs corpus versions, not the world. A committed corpus cannot know
 * what IMO published last week, and stage 1's wording has to reflect that.
 */
export function amendedSince(since: string): CorpusRecord[] {
  return CORPUS.filter(r => r.amendedAt !== undefined && r.amendedAt > since)
}

/** Distinct instruments represented in the corpus, for the stage 1 readout. */
export function instrumentsInForce(): string[] {
  return [...new Set(CORPUS.map(r => r.instrument))].sort()
}
