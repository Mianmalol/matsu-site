// ═══════════════════════════════════════════════════════════════════════════
//  SEED THE CANONICAL RUN
//
//    npm run seed:agents
//
//  Performs one real agent run across the whole fleet and writes the result to
//  src/data/canonicalRun.json, which is committed and shipped in the bundle.
//
//  Why commit a generated artefact at all: it means a visitor who opens /demo
//  and only looks around costs ZERO tokens and sees a populated fleet instantly,
//  instead of staring at an empty dashboard while twenty model calls run. Live
//  runs then layer on top for anyone who wants to watch the agents work.
//
//  Because it is generated, it can go stale against the corpus and the code
//  beside it. The header block written into the file records the corpus version
//  and a hash of the corpus contents, and `npm run check:fleet` fails the build
//  if they no longer match. A fixture that silently disagrees with the corpus it
//  claims to derive from is worse than no fixture.
//
//  Requires Gateway credentials: run under `vercel env pull` output, or with
//  AI_GATEWAY_API_KEY set.
// ═══════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  runActions,
  runAssignment,
  runEvidence,
  runRequirements,
  runScan,
} from '../api/_lib/stages.js'
import { MODEL_ID } from '../api/_lib/model.js'
import { CORPUS, CORPUS_VERSION, applicableRecords } from '../shared/corpus.js'
import { FLEET } from '../shared/fleet.js'
import { buildApprovals, buildEvents, buildVesselRun } from '../shared/assemble.js'
import { corpusHash } from './corpus-hash.js'
import type { AgentEvent, FleetRun, VesselRun } from '../shared/types.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '..', 'src', 'data', 'canonicalRun.json')

function log(msg: string): void {
  process.stdout.write(`${msg}\n`)
}

async function main(): Promise<void> {
  const startedAt = new Date()

  log(`Corpus ${CORPUS_VERSION} (${CORPUS.length} records, hash ${corpusHash()})`)
  log(`Model   ${MODEL_ID}`)
  log('')

  log('Stage 1  regulation scanning (fleet-wide)')
  const scan = await runScan()
  log(`         ${scan.recordsIndexed} records, ${scan.changedSince.length} amended since last version`)

  const vessels: VesselRun[] = []
  const events: AgentEvent[] = []

  for (const vessel of FLEET) {
    log('')
    log(`${vessel.name}`)

    const applicable = applicableRecords(vessel).length

    const { requirements, report: r2 } = await runRequirements(vessel)
    log(`  stage 2  ${requirements.length} obligations extracted${describe(r2)}`)

    const assignment = await runAssignment(vessel, requirements)
    log(`  stage 3  assignment explained (${assignment.drivers.length} drivers)`)

    const { actions, report: r4 } = await runActions(vessel, requirements)
    log(`  stage 4  ${actions.length} actions generated${describe(r4)}`)

    const { evidence, report: r5 } = await runEvidence(vessel, actions)
    const rejected = evidence.filter(e => e.verdict === 'rejected').length
    log(`  stage 5  ${evidence.length} evidence items, ${rejected} rejected${describe(r5)}`)

    const approvals = buildApprovals(evidence, actions)
    log(`  stage 6  ${approvals.length} items awaiting a human decision`)

    const run = buildVesselRun({
      vessel,
      recordsIndexed: scan.recordsIndexed,
      applicableRecordCount: applicable,
      requirements,
      assignmentSummary: assignment.summary,
      actions,
      evidence,
      approvals,
    })

    vessels.push(run)
    events.push(...buildEvents(vessel, run, startedAt))
  }

  events.sort((a, b) => b.at.localeCompare(a.at))

  const fleetRun: FleetRun = {
    completedAt: new Date().toISOString(),
    model: MODEL_ID,
    scan,
    vessels,
    events,
  }

  const payload = {
    // Provenance. Read by check:fleet, which fails the build if the corpus has
    // moved on without this file being regenerated.
    schemaVersion: 1,
    seeded: true,
    corpusVersion: CORPUS_VERSION,
    corpusHash: corpusHash(),
    ...fleetRun,
  }

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  const seconds = ((Date.now() - startedAt.getTime()) / 1000).toFixed(1)
  log('')
  log(`Wrote ${OUT}`)
  log(`${vessels.length} hulls in ${seconds}s`)
}

/** Surfaces anything the guard threw away, rather than letting it pass quietly. */
function describe(report: { badCitations: string[]; danglingRefs: string[]; duplicates: number }): string {
  const notes: string[] = []
  if (report.badCitations.length > 0) {
    notes.push(`${report.badCitations.length} bad citations dropped (${[...new Set(report.badCitations)].join(', ')})`)
  }
  if (report.danglingRefs.length > 0) notes.push(`${report.danglingRefs.length} dangling refs dropped`)
  if (report.duplicates > 0) notes.push(`${report.duplicates} duplicates dropped`)
  return notes.length > 0 ? `  [${notes.join('; ')}]` : ''
}

main().catch((err: unknown) => {
  console.error('\nSeed run failed.')
  console.error(err instanceof Error ? err.message : err)
  console.error(
    '\nIf this is an auth error, the Gateway credential has probably expired.' +
      '\nRun `vercel env pull` and try again, or set AI_GATEWAY_API_KEY.',
  )
  process.exit(1)
})
