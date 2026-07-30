// Audits two honesty invariants around the real Pacific International Lines
// fleet data. Run with: npm run check:fleet
//
// Scope narrowed deliberately. The original version banned verdict vocabulary
// near any of the 109 real vessel names anywhere in src/, which was the right
// rule when the demo was built around invented hulls. The product demo at /demo
// is now a faithful port of the Figma Make export and does show illustrative
// pipeline state against real names, labelled as demo data in its chrome. So:
//
//   1. src/sections/ — the public marketing page, indexed by search engines and
//      read without any product chrome around it. Stays verdict-free.
//   2. all of src/  — no named individual may be presented as a PIL employee.
//      A vessel's simulated status in a labelled demo is one thing; inventing a
//      person at a real company is another, and no surface gets to do it.
//
// src/demo/ is exempt from (1) by design, not by oversight. It is noindex'd,
// sits behind auth, and carries its own "Demo data" marker.

import fs from 'node:fs'
import path from 'node:path'

const ROOT = new URL('../src', import.meta.url).pathname

const fleetSrc = fs.readFileSync(path.join(ROOT, 'data/pilFleet.ts'), 'utf8')
const names = [...fleetSrc.matchAll(/name: '([^']+)'/g)].map(m => m[1])
if (names.length !== 109) throw new Error('expected 109 names, got ' + names.length)

// Words that assert a compliance state or an adverse finding.
const VERDICT = [
  'compliant', 'needs review', 'needs-review', 'deficien', 'rejected', 'overdue',
  'flagged', 'psc risk', 'non-conformity', 'approved', 'accepted', 'complete',
  'sulphur', 'violation', 'breach',
]

// Roles that, if given a personal name, would invent an employee at a real
// company. Matches "<Firstname Lastname>" adjacent to the role, or the reverse.
const PERSON_ROLES = ['designated person ashore', 'dpa', 'fleet manager', 'superintendent', 'master']
const NAME_RE = /\b[A-Z][a-z]{1,15}\s+[A-Z][a-z]{1,15}\b/g

// Capitalised pairs that are places, instruments or labels rather than people.
const NOT_A_PERSON = new Set([
  'Designated Person', 'Person Ashore', 'Fleet Overview', 'Fleet Manager', 'Pacific International',
  'International Lines', 'Marshall Islands', 'Hong Kong', 'Port Klang', 'Buenos Aires', 'Ho Chi',
  'Port Moresby', 'Tanjung Pelepas', 'Dar es', 'Xin Zhou', 'Needs Review', 'In Progress',
  'Regulation Scanning', 'Requirement Extraction', 'Vessel Assignment', 'Action Assignment',
  'Evidence Collection', 'Security Plan', 'Update Ship', 'Seafarer Employment', 'Every Monday',
  'Recent Mo', 'Regional Mo', 'Code Part', 'Code Rev', 'Safety Management', 'Little Mermaid',
  'Salam Maju', 'Selatan Damai', 'Zhong Hang', 'Zhu Cheng', 'Kota Anggun',
])

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(p) ? [p] : []
  })
}

const files = walk(ROOT)
const verdictHits = []
const personHits = []

for (const file of files) {
  const rel = path.relative(ROOT, file)
  const lines = fs.readFileSync(file, 'utf8').split('\n')

  lines.forEach((line, i) => {
    const lower = line.toLowerCase()

    // (1) Marketing sections only. pilFleet.ts is the identity table itself.
    if (rel.startsWith('sections/')) {
      const hitName = names.find(n => line.includes(n))
      const hitWord = VERDICT.find(w => lower.includes(w))
      if (hitName && hitWord) {
        verdictHits.push(`${rel}:${i + 1}  vessel "${hitName}" near "${hitWord}"\n    ${line.trim().slice(0, 150)}`)
      }
    }

    // (2) Everywhere, including the demo.
    if (PERSON_ROLES.some(r => lower.includes(r))) {
      // A capitalised pair sitting in a `vessel:` or `name:` slot is a ship, not
      // a person, even on a line that also mentions the DPA. Drop those values
      // before looking for names, rather than growing the exclusion list with
      // every vessel someone invents.
      const scannable = line.replace(/\b(?:vessel|name)\s*:\s*(['"`])(?:\\.|(?!\1).)*\1/gi, '')
      for (const m of scannable.match(NAME_RE) ?? []) {
        if (!NOT_A_PERSON.has(m) && !names.includes(m)) {
          personHits.push(`${rel}:${i + 1}  "${m}" reads as a named person in a PIL role\n    ${line.trim().slice(0, 150)}`)
        }
      }
    }
  })
}

// The identity table must carry no state field, so a real hull cannot be
// structurally rendered compliant or deficient from that data alone.
const stateFields = ['status', 'state', 'complete', 'needs-review', 'active', 'pending']
const leaked = stateFields.filter(f => new RegExp(`\\b${f}\\s*:`, 'i').test(fleetSrc))

console.log('PIL vessel names indexed:      ', names.length)
console.log('Files scanned:                 ', files.length)
console.log('State fields in pilFleet.ts:   ', leaked.length ? leaked.join(', ') : 'none')
console.log('')

let failed = false
if (verdictHits.length) {
  failed = true
  console.log(`FAIL — ${verdictHits.length} verdict occurrence(s) in src/sections/:`)
  verdictHits.forEach(p => console.log('  ' + p))
} else {
  console.log('PASS — no real vessel name near verdict vocabulary in src/sections/.')
}

if (leaked.length) {
  failed = true
  console.log(`FAIL — pilFleet.ts gained a state field: ${leaked.join(', ')}`)
}

if (personHits.length) {
  failed = true
  console.log(`FAIL — ${personHits.length} named individual(s) in a PIL role:`)
  personHits.forEach(p => console.log('  ' + p))
} else {
  console.log('PASS — no named individual presented as a PIL employee.')
}

if (failed) process.exitCode = 1
