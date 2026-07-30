// ═══════════════════════════════════════════════════════════════════════════
//  PIL FLEET · IDENTITY ONLY
//
//  Real, publicly published vessel identities. This file deliberately carries
//  NO compliance state. PIL is a prospect, not a customer, so nothing here may
//  assert or imply that one of their hulls is compliant, deficient, or under
//  review. Simulated pipeline state lives in ./scenario.ts and is attached at
//  render time behind a visible "simulated" marker.
//
//  Keep that separation. If a status field ever lands in this file, the
//  honesty guarantee is gone.
//
//  Generated from the operator fleet list. Do not hand-edit rows.
// ═══════════════════════════════════════════════════════════════════════════

export interface FleetIdentity {
  /** As published in the operator fleet list. */
  name: string
  /** Flag state, full name as published. */
  flag: string
  /** Year built. null where the fleet list omits it. */
  year: number | null
  /** Nominal TEU capacity. 0 means on order, not yet delivered. */
  teu: number
}

export const FLEET_SOURCE = {
  operator: 'Pacific International Lines',
  source: 'PIL public fleet list',
  retrieved: '2026-07',
} as const

export const pilFleet: FleetIdentity[] = [
  { name: 'Asterios',           flag: 'Liberia',           year: 2023, teu: 1827 },
  { name: 'Kota Anggun',        flag: 'Singapore',         year: 1999, teu: 1454 },
  { name: 'Kota Azam',          flag: 'Singapore',         year: 1999, teu: 1454 },
  { name: 'Kota Cabar',         flag: 'Singapore',         year: 2012, teu: 6606 },
  { name: 'Kota Cahaya',        flag: 'Singapore',         year: 2012, teu: 6606 },
  { name: 'Kota Callao',        flag: 'Marshall Islands',  year: null, teu: 7092 },
  { name: 'Kota Cantik',        flag: 'Singapore',         year: 2012, teu: 6606 },
  { name: 'Kota Carum',         flag: 'Singapore',         year: 2011, teu: 6606 },
  { name: 'Kota Cempaka',       flag: 'Singapore',         year: 2013, teu: 6606 },
  { name: 'Kota Cepat',         flag: 'Singapore',         year: 2013, teu: 6606 },
  { name: 'Kota Dahlia',        flag: 'Singapore',         year: 2008, teu: 628 },
  { name: 'Kota Dunia',         flag: 'Singapore',         year: 2010, teu: 628 },
  { name: 'Kota Duta',          flag: 'Singapore',         year: 2011, teu: 628 },
  { name: 'Kota Eagle',         flag: 'Singapore',         year: 2024, teu: 14450 },
  { name: 'Kota Ebony',         flag: 'Singapore',         year: 2025, teu: 14450 },
  { name: 'Kota Embun',         flag: 'Singapore',         year: 2025, teu: 14410 },
  { name: 'Kota Emerald',       flag: 'Singapore',         year: 2025, teu: 14450 },
  { name: 'Kota Gabung',        flag: 'Singapore',         year: 2013, teu: 2754 },
  { name: 'Kota Gadang',        flag: 'Singapore',         year: 2013, teu: 2800 },
  { name: 'Kota Ganding',       flag: 'Singapore',         year: 2013, teu: 2800 },
  { name: 'Kota Gaya',          flag: 'Singapore',         year: 2012, teu: 2754 },
  { name: 'Kota Hakim',         flag: 'Singapore',         year: 2001, teu: 1080 },
  { name: 'Kota Halus',         flag: 'Singapore',         year: 2002, teu: 1080 },
  { name: 'Kota Handal',        flag: 'Singapore',         year: 2003, teu: 1080 },
  { name: 'Kota Hapas',         flag: 'Singapore',         year: null, teu: 1080 },
  { name: 'Kota Harum',         flag: 'Singapore',         year: 2002, teu: 1080 },
  { name: 'Kota Hening',        flag: 'Singapore',         year: 2003, teu: 1080 },
  { name: 'Kota Hidayah',       flag: 'Singapore',         year: 2002, teu: 1170 },
  { name: 'Kota Jaya',          flag: 'Singapore',         year: 2000, teu: 1728 },
  { name: 'Kota Johan',         flag: 'Singapore',         year: 2017, teu: 2034 },
  { name: 'Kota Kamil',         flag: 'Singapore',         year: 2006, teu: 3081 },
  { name: 'Kota Karim',         flag: 'Singapore',         year: 2006, teu: 3081 },
  { name: 'Kota Kaya',          flag: 'Singapore',         year: 2005, teu: 3081 },
  { name: 'Kota Lambai',        flag: 'Singapore',         year: 2008, teu: 4253 },
  { name: 'Kota Lambang',       flag: 'Singapore',         year: 2008, teu: 4253 },
  { name: 'Kota Laris',         flag: 'Singapore',         year: 2008, teu: 4253 },
  { name: 'Kota Lawa',          flag: 'Singapore',         year: 2008, teu: 4253 },
  { name: 'Kota Layang',        flag: 'Singapore',         year: 2009, teu: 4253 },
  { name: 'Kota Legit',         flag: 'Singapore',         year: 2014, teu: 4800 },
  { name: 'Kota Lekas',         flag: 'Singapore',         year: 2014, teu: 4800 },
  { name: 'Kota Lembah',        flag: 'Singapore',         year: 2013, teu: 4335 },
  { name: 'Kota Lestari',       flag: 'Singapore',         year: 2014, teu: 4335 },
  { name: 'Kota Lihat',         flag: 'Singapore',         year: 2013, teu: 4335 },
  { name: 'Kota Lima',          flag: 'Liberia',           year: 2002, teu: 5544 },
  { name: 'Kota Loceng',        flag: 'Singapore',         year: 2013, teu: 4335 },
  { name: 'Kota Lumayan',       flag: 'Singapore',         year: 2010, teu: 4253 },
  { name: 'Kota Lumba',         flag: 'Hong Kong',         year: 2010, teu: 4253 },
  { name: 'Kota Machan',        flag: 'Singapore',         year: 2013, teu: 3566 },
  { name: 'Kota Makmur',        flag: 'Hong Kong',         year: 2013, teu: 3566 },
  { name: 'Kota Manis',         flag: 'Singapore',         year: 2013, teu: 3566 },
  { name: 'Kota Manzanillo',    flag: 'Liberia',           year: 2005, teu: 8533 },
  { name: 'Kota Megah',         flag: 'Singapore',         year: 2013, teu: 3566 },
  { name: 'Kota Nabil',         flag: 'Singapore',         year: 2008, teu: 1810 },
  { name: 'Kota Naga',          flag: 'Singapore',         year: 2008, teu: 1810 },
  { name: 'Kota Naluri',        flag: 'Singapore',         year: 2008, teu: 1810 },
  { name: 'Kota Nanhai',        flag: 'Singapore',         year: 2008, teu: 1810 },
  { name: 'Kota Nasrat',        flag: 'Singapore',         year: 2008, teu: 1810 },
  { name: 'Kota Nazar',         flag: 'Singapore',         year: 2009, teu: 1810 },
  { name: 'Kota Nazim',         flag: 'Singapore',         year: 2008, teu: 1810 },
  { name: 'Kota Nebula',        flag: 'Singapore',         year: 2010, teu: 1810 },
  { name: 'Kota Nekad',         flag: 'Panama',            year: 2009, teu: 1810 },
  { name: 'Kota Nilam',         flag: 'Singapore',         year: 2009, teu: 1810 },
  { name: 'Kota Nipah',         flag: 'Singapore',         year: 2011, teu: 1810 },
  { name: 'Kota Oasis',         flag: 'Singapore',         year: 2025, teu: 8350 },
  { name: 'Kota Ocean',         flag: 'Singapore',         year: null, teu: 8350 },
  { name: 'Kota Odyssey',       flag: 'Singapore',         year: 2025, teu: 8350 },
  { name: 'Kota Orkid',         flag: 'Singapore',         year: 2025, teu: 8350 },
  { name: 'Kota Pahlawan',      flag: 'Singapore',         year: 2017, teu: 11923 },
  { name: 'Kota Pelangi',       flag: 'Singapore',         year: 2018, teu: 11923 },
  { name: 'Kota Peony',         flag: 'Liberia',           year: 2012, teu: 13082 },
  { name: 'Kota Plumbago',      flag: 'Greece',            year: 2012, teu: 13082 },
  { name: 'Kota Primrose',      flag: 'Liberia',           year: 2012, teu: 13082 },
  { name: 'Kota Puri',          flag: 'Hong Kong',         year: 2019, teu: 11923 },
  { name: 'Kota Pusaka',        flag: 'Hong Kong',         year: 2019, teu: 11923 },
  { name: 'Kota Rahmat',        flag: 'Singapore',         year: 2008, teu: 907 },
  { name: 'Kota Raja',          flag: 'Singapore',         year: 1998, teu: 777 },
  { name: 'Kota Rajin',         flag: 'Singapore',         year: 2005, teu: 943 },
  { name: 'Kota Rakan',         flag: 'Singapore',         year: 2008, teu: 907 },
  { name: 'Kota Rakyat',        flag: 'Singapore',         year: 2006, teu: 907 },
  { name: 'Kota Rancak',        flag: 'Singapore',         year: 2005, teu: 943 },
  { name: 'Kota Ratna',         flag: 'Singapore',         year: 1998, teu: 777 },
  { name: 'Kota Ratu',          flag: 'Singapore',         year: 1998, teu: 777 },
  { name: 'Kota Restu',         flag: 'Singapore',         year: 2009, teu: 943 },
  { name: 'Kota Ria',           flag: 'Singapore',         year: 2006, teu: 907 },
  { name: 'Kota Rukun',         flag: 'Singapore',         year: 1998, teu: 777 },
  { name: 'Kota Sabas',         flag: 'Singapore',         year: 2014, teu: 3889 },
  { name: 'Kota Sahabat',       flag: 'Singapore',         year: 2014, teu: 3889 },
  { name: 'Kota Salam',         flag: 'Singapore',         year: 2014, teu: 3889 },
  { name: 'Kota Santos',        flag: 'Liberia',           year: 2005, teu: 8463 },
  { name: 'Kota Satria',        flag: 'Singapore',         year: 2014, teu: 3889 },
  { name: 'Kota Segar',         flag: 'Singapore',         year: 2014, teu: 3889 },
  { name: 'Kota Sejarah',       flag: 'Singapore',         year: 2014, teu: 3889 },
  { name: 'Kota Sejati',        flag: 'Singapore',         year: 2015, teu: 3889 },
  { name: 'Kota Selamat',       flag: 'Singapore',         year: 2015, teu: 3889 },
  { name: 'Kota Sempena',       flag: 'Singapore',         year: 2015, teu: 3889 },
  { name: 'Kota Setia',         flag: 'Singapore',         year: 2015, teu: 3889 },
  { name: 'Kota Singa',         flag: 'Singapore',         year: 2015, teu: 3889 },
  { name: 'Kota Suria',         flag: 'Singapore',         year: 2015, teu: 3889 },
  { name: 'Kota Sydney',        flag: 'Singapore',         year: null, teu: 7092 },
  { name: 'Kota Tema',          flag: 'Singapore',         year: 2024, teu: 7092 },
  { name: 'Kota Tenaga',        flag: 'Singapore',         year: 2002, teu: 728 },
  { name: 'Kota Valparaiso',    flag: 'Marshall Islands',  year: 2024, teu: 7092 },
  { name: 'Little Mermaid',     flag: 'Liberia',           year: 2022, teu: 1781 },
  { name: 'Pacanda',            flag: 'Antigua & Barbuda', year: 2007, teu: 0 },
  { name: 'Salam Maju',         flag: 'Malaysia',          year: 2001, teu: 1170 },
  { name: 'SC Mara',            flag: 'Cyprus',            year: 2006, teu: 5060 },
  { name: 'Selatan Damai',      flag: 'Indonesia',         year: 2017, teu: 628 },
  { name: 'Zhong Hang Sheng',   flag: 'China',             year: 2004, teu: 2783 },
  { name: 'Zhu Cheng Xin Zhou', flag: 'China',             year: 2002, teu: 2526 },
]

export const FLEET_COUNT = pilFleet.length

/** Two-letter code for the flag states present in this fleet, for compact display. */
export const FLAG_CODE: Record<string, string> = {
  'Singapore': 'SG',
  'Liberia': 'LR',
  'Marshall Islands': 'MH',
  'Hong Kong': 'HK',
  'Panama': 'PA',
  'Greece': 'GR',
  'Cyprus': 'CY',
  'China': 'CN',
  'Malaysia': 'MY',
  'Indonesia': 'ID',
  'Antigua & Barbuda': 'AG',
}
