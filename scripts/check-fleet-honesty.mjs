// Audits the honesty invariant: no real PIL vessel name may co-occur with
// compliance-verdict or adverse vocabulary anywhere in the shipped source.
import fs from 'node:fs'
import path from 'node:path'

// Run with: npm run check:fleet

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

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(p) ? [p] : []
  })
}

const problems = []
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file)
  // pilFleet.ts is the identity table itself; its own rows are the source of truth.
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    const lower = line.toLowerCase()
    const hitName = names.find(n => line.includes(n))
    if (!hitName) return
    if (rel === 'data/pilFleet.ts') return // identity rows, no state present
    const hitWord = VERDICT.find(w => lower.includes(w))
    if (hitWord) {
      problems.push(`${rel}:${i + 1}  vessel "${hitName}" near "${hitWord}"\n    ${line.trim().slice(0, 150)}`)
    }
  })
}

// Second check: the identity table must carry no state field at all.
const stateFields = ['status', 'state', 'complete', 'needs-review', 'active', 'pending']
const leaked = stateFields.filter(f => new RegExp(`\\b${f}\\s*:`, 'i').test(fleetSrc))

console.log('PIL vessel names indexed:', names.length)
console.log('State fields leaked into pilFleet.ts:', leaked.length ? leaked.join(', ') : 'none')
console.log('')
if (problems.length === 0) {
  console.log('PASS — no real vessel name co-occurs with verdict or adverse vocabulary.')
} else {
  console.log('FAIL — ' + problems.length + ' occurrence(s):')
  problems.forEach(p => console.log('  ' + p))
  process.exitCode = 1
}
