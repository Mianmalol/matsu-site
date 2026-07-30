// Audits the honesty invariants around real Pacific International Lines fleet
// data. Run with: npm run check:fleet
//
// Real PIL identities exist in exactly one place: the FLEET array in
// src/demo/DemoApp.tsx, the gated product demo. That demo is behind auth,
// noindex'd, and labelled as demo data in its own chrome, and it shows
// illustrative pipeline state against those names deliberately.
//
// The marketing page is the opposite situation: public, indexed, read with no
// product chrome around it. A roster there reads as a customer list and a status
// column reads as a claim about someone's ships. So:
//
//   1. src/sections/ names no real PIL vessel and not the operator either. It
//      uses the invented fleet in src/data/demoFleet.ts.
//   2. Nowhere in src/ is a named individual presented as a PIL employee. A
//      ship's illustrative status inside a labelled demo is one thing;
//      inventing a person at a real company is another.
//
// Earlier versions of this script read the names from a src/data/pilFleet.ts
// that no longer exists — the marketing page stopped using real identities, so
// the only copy left is the demo's own array.

import fs from 'node:fs'
import path from 'node:path'

const ROOT = new URL('../src', import.meta.url).pathname
const DEMO = path.join(ROOT, 'demo/DemoApp.tsx')

// Pull the FLEET rows: ["Kota Anggun", "Singapore", 1999, 1454, "complete"],
const demoSrc = fs.readFileSync(DEMO, 'utf8')
const fleetBlock = demoSrc.slice(demoSrc.indexOf('const FLEET: Spec[] = ['), demoSrc.indexOf('const VESSELS'))
const names = [...fleetBlock.matchAll(/\[\s*"([^"]+)"/g)].map(m => m[1])
if (names.length !== 109) throw new Error(`expected 109 PIL names in ${DEMO}, got ${names.length}`)

const OPERATOR_STRINGS = ['Pacific International Lines', 'PIL public fleet list']

// Roles that, if given a personal name, would invent an employee at a real
// company. Matches "<Firstname Lastname>" on the same line as the role.
const PERSON_ROLES = ['designated person ashore', 'dpa', 'fleet manager', 'superintendent', 'master']
const NAME_RE = /\b[A-Z][a-z]{1,15}\s+[A-Z][a-z]{1,15}\b/g

// Capitalised pairs that are places, instruments or UI labels rather than people.
const NOT_A_PERSON = new Set([
  'Designated Person', 'Person Ashore', 'Fleet Overview', 'Fleet Manager', 'Pacific International',
  'International Lines', 'Marshall Islands', 'Hong Kong', 'Port Klang', 'Buenos Aires', 'Ho Chi',
  'Port Moresby', 'Tanjung Pelepas', 'Dar es', 'Xin Zhou', 'Needs Review', 'In Progress',
  'Regulation Scanning', 'Requirement Extraction', 'Vessel Assignment', 'Action Assignment',
  'Evidence Collection', 'Security Plan', 'Update Ship', 'Seafarer Employment', 'Every Monday',
  'Recent Mo', 'Regional Mo', 'Code Part', 'Code Rev', 'Safety Management', 'Little Mermaid',
  'Salam Maju', 'Selatan Damai', 'Zhong Hang', 'Zhu Cheng', 'Full Cycle', 'Cycle State',
  'Example Fleet', 'Meridian Line', 'Worked Cycles',
])

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(p) ? [p] : []
  })
}

const files = walk(ROOT)
const marketingHits = []
const personHits = []

for (const file of files) {
  const rel = path.relative(ROOT, file)
  const lines = fs.readFileSync(file, 'utf8').split('\n')

  lines.forEach((line, i) => {
    const lower = line.toLowerCase()
    // Comments explain the rule and necessarily mention what it forbids.
    const isComment = /^\s*(\/\/|\*|\/\*)/.test(line)

    // (1) The public marketing page.
    if (rel.startsWith('sections/') && !isComment) {
      const hit = names.find(n => new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(line))
        ?? OPERATOR_STRINGS.find(o => line.includes(o))
      if (hit) {
        marketingHits.push(`${rel}:${i + 1}  names "${hit}" on the public page\n    ${line.trim().slice(0, 150)}`)
      }
    }

    // (2) Everywhere, including the demo.
    if (PERSON_ROLES.some(r => lower.includes(r))) {
      // A capitalised pair in a `vessel:` or `name:` slot is a ship, not a
      // person, even on a line that also mentions the DPA. Drop those values
      // rather than growing the exclusion list with every invented vessel.
      const scannable = line.replace(/\b(?:vessel|name)\s*:\s*(['"`])(?:\\.|(?!\1).)*\1/gi, '')
      for (const m of scannable.match(NAME_RE) ?? []) {
        if (!NOT_A_PERSON.has(m) && !names.includes(m)) {
          personHits.push(`${rel}:${i + 1}  "${m}" reads as a named person in a PIL role\n    ${line.trim().slice(0, 150)}`)
        }
      }
    }
  })
}

console.log('Real PIL names (demo only):', names.length)
console.log('Files scanned:             ', files.length)
console.log('')

let failed = false
if (marketingHits.length) {
  failed = true
  console.log(`FAIL — ${marketingHits.length} real PIL reference(s) in src/sections/:`)
  marketingHits.forEach(p => console.log('  ' + p))
} else {
  console.log('PASS — src/sections/ names no real PIL vessel or the operator.')
}

if (personHits.length) {
  failed = true
  console.log(`FAIL — ${personHits.length} named individual(s) in a PIL role:`)
  personHits.forEach(p => console.log('  ' + p))
} else {
  console.log('PASS — no named individual presented as a PIL employee.')
}

if (failed) process.exitCode = 1
