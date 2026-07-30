// ═══════════════════════════════════════════════════════════════════════════
//  MATSU LINES — THE DEMONSTRATION FLEET
//
//  Five invented hulls belonging to an invented carrier. No vessel, IMO number,
//  or operator here corresponds to a real ship or a real company. This replaced
//  a roster of 109 real, published Pacific International Lines identities: a
//  demo that assigns compliance verdicts to real hulls is making claims about
//  someone else's ships, and there is no version of that we are in a position
//  to make.
//
//  The five are deliberately unalike. A fleet of near-identical container ships
//  produces near-identical obligation sets, which makes the product look like a
//  template with the tonnage swapped out. These differ on every axis the
//  conventions actually key off — type, gross tonnage, flag, fuel, build year,
//  trading area — so the agents genuinely arrive at different answers per hull:
//
//    · Solace is the only chemical tanker, so MARPOL Annex II and the P&A
//      Manual apply to it and to nothing else in the fleet.
//    · Aurora is the only gas-fuelled ship, so the IGF Code applies to it alone.
//    · Kestrel is the oldest hull, so it sits under EEXI as an existing ship
//      and under retrofit deadlines the newer tonnage was built compliant with,
//      where Aurora is a post-2013 delivery and answers to EEDI instead.
//    · Cordillera is the only bulk carrier, which changes its Annex V and hold
//      inspection picture.
//    · Meridian is the plain case — a mid-life box boat with nothing exotic.
// ═══════════════════════════════════════════════════════════════════════════

import type { Vessel } from './types.js'

/** The invented carrier. */
export const OPERATOR = 'Matsu Lines'

export const FLEET: Vessel[] = [
  {
    id: 'matsu-meridian',
    name: 'Matsu Meridian',
    type: 'Container',
    flag: 'Singapore',
    imo: '9612447',
    built: 2019,
    gt: 92_400,
    dwt: 104_500,
    teu: 8_200,
    fuel: 'HFO/VLSFO',
    tradingArea: 'Asia–Europe',
    route: 'Singapore → Rotterdam (NE3)',
  },
  {
    id: 'matsu-kestrel',
    name: 'Matsu Kestrel',
    type: 'Container',
    flag: 'Panama',
    imo: '9354081',
    built: 2008,
    gt: 13_760,
    dwt: 18_200,
    teu: 1_118,
    fuel: 'MGO',
    tradingArea: 'Intra-Asia',
    route: 'Port Klang → Ho Chi Minh (IA2)',
  },
  {
    id: 'matsu-solace',
    name: 'Matsu Solace',
    type: 'Chemical/Products Tanker',
    flag: 'Marshall Islands',
    imo: '9847213',
    built: 2021,
    gt: 29_900,
    dwt: 49_700,
    teu: 0,
    fuel: 'HFO/VLSFO',
    tradingArea: 'Middle East–India',
    route: 'Jubail → Mundra',
  },
  {
    id: 'matsu-cordillera',
    name: 'Matsu Cordillera',
    type: 'Bulk Carrier',
    flag: 'Liberia',
    imo: '9701338',
    built: 2015,
    gt: 44_100,
    dwt: 81_600,
    teu: 0,
    fuel: 'HFO/VLSFO',
    tradingArea: 'Transpacific',
    route: 'Dampier → Qingdao',
  },
  {
    id: 'matsu-aurora',
    name: 'Matsu Aurora',
    type: 'LNG-Fuelled Container',
    flag: 'Singapore',
    imo: '9955172',
    built: 2025,
    gt: 152_800,
    dwt: 165_200,
    teu: 14_000,
    fuel: 'LNG dual-fuel',
    tradingArea: 'Asia–Europe',
    route: 'Ningbo → Hamburg (NE1)',
  },
]

export const FLEET_BY_ID: Record<string, Vessel> = Object.fromEntries(
  FLEET.map(v => [v.id, v]),
)

/** How the roster prints a hull's size: boxes where that's the measure, tonnes otherwise. */
export function capacityLabel(v: Vessel): string {
  return v.teu > 0 ? `${v.teu.toLocaleString()} TEU` : `${v.dwt.toLocaleString()} DWT`
}

/** The one-line descriptor the vessel page and search results show under the name. */
export function typeLabel(v: Vessel): string {
  return v.teu > 0
    ? `${v.type} — ${v.teu.toLocaleString()} TEU`
    : `${v.type} — ${v.dwt.toLocaleString()} DWT`
}
