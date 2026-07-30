// ═══════════════════════════════════════════════════════════════════════════
//  HONESTY AND INTEGRITY CHECKS
//
//    npm run check:fleet   (also runs as part of npm run build)
//
//  The previous version of this script guarded a situation that no longer
//  exists: the demo used to carry 109 real Pacific International Lines hulls,
//  and the check kept them off the public marketing page. The demo now uses an
//  invented five-ship fleet, so that particular risk is gone.
//
//  What replaces it is the set of claims the product now makes, each of which
//  can quietly stop being true:
//
//    1. No real carrier's identity appears anywhere. A regression guard — the
//       old data is one `git revert` away.
//    2. No named individual is presented as a company officer. Inventing a
//       person in a DPA role is a claim about a real job at a real company.
//    3. The committed canonical run still matches the corpus it claims to come
//       from. A fixture that drifted from its corpus is a demo asserting things
//       the current rulebook does not say.
//    4. Every citation in that run resolves to a real corpus record that
//       genuinely applies to the hull it is attached to. This is the one the
//       whole pipeline's credibility rests on: it is the difference between
//       "traced to a regulation" and "wrote something regulation-shaped".
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CORPUS_BY_ID, CORPUS_VERSION, appliesTo } from '../shared/corpus'
import { FLEET_BY_ID } from '../shared/fleet'
import { corpusHash } from './corpus-hash'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(HERE, '..')
const CANONICAL = join(ROOT, 'src', 'data', 'canonicalRun.json')

const failures: string[] = []
const passes: string[] = []

function pass(msg: string): void {
  passes.push(msg)
}
function fail(msg: string, detail: string[] = []): void {
  failures.push([msg, ...detail.map(d => `    ${d}`)].join('\n'))
}

// ── 1 + 2. Source scan ───────────────────────────────────────────────────────

function walk(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = join(dir, e.name)
    if (e.isDirectory()) return walk(p)
    return /\.(ts|tsx)$/.test(p) ? [p] : []
  })
}

/** Identities belonging to a real carrier. None of these may reappear. */
const REAL_CARRIER = [
  /\bPacific International Lines\b/,
  /\bKota [A-Z][a-z]+/,
  /\bPIL\b(?! ?[a-z])/,
]

/** Roles where a personal name would invent an employee. */
const OFFICER_ROLES = [
  'designated person ashore',
  'dpa',
  'fleet manager',
  'superintendent',
]

const NAME_RE = /\b[A-Z][a-z]{1,15}\s+[A-Z][a-z]{1,15}\b/g

/** Capitalised pairs that are places, instruments or UI labels, not people. */
const NOT_A_PERSON = new Set([
  'Designated Person', 'Person Ashore', 'Fleet Overview', 'Fleet Manager',
  'Matsu Lines', 'Matsu Meridian', 'Matsu Kestrel', 'Matsu Solace',
  'Matsu Cordillera', 'Matsu Aurora', 'Marshall Islands', 'Port Klang',
  'Ho Chi', 'Needs Review', 'In Progress', 'Regulation Scanning',
  'Requirement Extraction', 'Vessel Assignment', 'Action Assignment',
  'Evidence Collection', 'Record Book', 'Drill Report', 'Survey Report',
  'Analysis Report', 'Safety Management', 'Demo Data', 'Run Agents',
  'Meridian Line', 'Every Monday', 'Agent Alerts', 'Weekly Fleet',
])

const carrierHits: string[] = []
const personHits: string[] = []

for (const dir of ['src', 'shared', 'api']) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, file)
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        // Comments explain the rules and necessarily name what they forbid.
        const isComment = /^\s*(\/\/|\*|\/\*)/.test(line)
        if (isComment) return

        for (const re of REAL_CARRIER) {
          if (re.test(line)) {
            carrierHits.push(`${rel}:${i + 1}  ${line.trim().slice(0, 120)}`)
            break
          }
        }

        if (OFFICER_ROLES.some(r => line.toLowerCase().includes(r))) {
          // A capitalised pair in a vessel/name slot is a ship, not a person.
          const scannable = line.replace(
            /\b(?:vessel|name|vesselName)\s*:\s*(['"`])(?:\\.|(?!\1).)*\1/gi,
            '',
          )
          for (const m of scannable.match(NAME_RE) ?? []) {
            if (!NOT_A_PERSON.has(m)) {
              personHits.push(`${rel}:${i + 1}  "${m}"  ${line.trim().slice(0, 100)}`)
            }
          }
        }
      })
  }
}

if (carrierHits.length > 0) {
  fail(`${carrierHits.length} reference(s) to a real carrier's identity:`, carrierHits)
} else {
  pass('No real carrier identity in src/, shared/ or api/.')
}

if (personHits.length > 0) {
  fail(`${personHits.length} named individual(s) in a company officer role:`, personHits)
} else {
  pass('No named individual presented as a company officer.')
}

// ── 3 + 4. Canonical run integrity ───────────────────────────────────────────

const canonicalRaw =
  existsSync(CANONICAL) ?
    (JSON.parse(readFileSync(CANONICAL, 'utf8')) as {
      seeded?: boolean
      schemaVersion?: number
      corpusVersion?: string
      corpusHash?: string
      model?: string
      vessels?: {
        vesselId: string
        requirements: { id: string; sourceId: string }[]
      }[]
    })
  : null

// The committed placeholder carries `seeded: false` so the build stays green
// before the first real run. Once seeded, the checks below become mandatory.
if (canonicalRaw === null || canonicalRaw.seeded === false) {
  pass(
    'Canonical run is an unseeded placeholder — fixture checks skipped.\n' +
      '         Run `npm run seed:agents` to generate the real one.',
  )
} else {
  const raw = canonicalRaw
  const expected = corpusHash()

  if (raw.corpusHash !== expected) {
    fail(
      'The committed canonical run no longer matches the corpus.',
      [
        `run was generated against corpus hash ${raw.corpusHash ?? '(none)'} (version ${raw.corpusVersion ?? '?'})`,
        `the corpus in this tree hashes to ${expected} (version ${CORPUS_VERSION})`,
        'the demo would show obligations the current rulebook does not support',
        'fix: npm run seed:agents',
      ],
    )
  } else {
    pass(`Canonical run matches corpus ${CORPUS_VERSION} (${expected}).`)
  }

  // Every hull in the fixture must be a hull we still have.
  const unknownVessels = (raw.vessels ?? [])
    .map(v => v.vesselId)
    .filter(id => !FLEET_BY_ID[id])

  if (unknownVessels.length > 0) {
    fail('Canonical run references vessels not in the fleet:', unknownVessels)
  } else {
    pass(`Canonical run covers ${raw.vessels?.length ?? 0} known hulls.`)
  }

  // The citation check. Every requirement must trace to a real record that
  // genuinely applies to the hull it was attached to.
  const badCitations: string[] = []
  const inapplicable: string[] = []

  for (const v of raw.vessels ?? []) {
    const vessel = FLEET_BY_ID[v.vesselId]
    if (!vessel) continue

    for (const r of v.requirements ?? []) {
      const record = CORPUS_BY_ID[r.sourceId]
      if (!record) {
        badCitations.push(`${v.vesselId} ${r.id} cites "${r.sourceId}", which is not in the corpus`)
      } else if (!appliesTo(record, vessel)) {
        inapplicable.push(`${v.vesselId} ${r.id} cites ${r.sourceId}, which does not apply to this hull`)
      }
    }
  }

  if (badCitations.length > 0) {
    fail(`${badCitations.length} requirement(s) cite a record that does not exist:`, badCitations.slice(0, 10))
  } else {
    pass('Every requirement in the canonical run cites a real corpus record.')
  }

  if (inapplicable.length > 0) {
    fail(
      `${inapplicable.length} requirement(s) cite a record that does not apply to their hull:`,
      inapplicable.slice(0, 10),
    )
  } else {
    pass('Every citation applies to the hull it is attached to.')
  }
}

// ── Report ───────────────────────────────────────────────────────────────────

for (const p of passes) console.log(`PASS — ${p}`)
if (failures.length > 0) {
  console.log('')
  for (const f of failures) console.log(`FAIL — ${f}`)
  process.exitCode = 1
}
