// ═══════════════════════════════════════════════════════════════════════════
//  CLIENT-SIDE RUN ORCHESTRATION
//
//  The browser drives the sequence, one bounded request per stage. That is a
//  deliberate inversion of the obvious design (one server call that streams the
//  whole run) and the reason is platform, not taste: SSE does not extend a
//  Vercel Function's maxDuration, so a single call carrying twenty model
//  round-trips gets killed partway through with no way to resume.
//
//  Driving it from here means each request finishes in seconds, a failure costs
//  one stage rather than the whole run, and progress is genuinely observable
//  because every stage boundary is a real response rather than a token in a
//  stream we hope arrives.
//
//  The trade is that stage N+1's input travels back through the client, so the
//  server treats it as untrusted and re-validates it. See api/_lib/guard.ts.
// ═══════════════════════════════════════════════════════════════════════════

import { applicableRecords, CORPUS } from '../../shared/corpus.js'
import { buildApprovals, buildEvents, buildVesselRun } from '../../shared/assemble.js'
import type {
  AgentEvent,
  ComplianceAction,
  EvidenceItem,
  Requirement,
  ScanResult,
  Vessel,
  VesselRun,
} from '../../shared/types.js'

export type TokenFn = () => Promise<string | null>

/** Thrown with a message worth showing the operator verbatim. */
export class RunError extends Error {}

async function post<T>(path: string, body: unknown, getToken: TokenFn): Promise<T> {
  const token = await getToken()
  if (!token) throw new RunError('Not signed in. Reload the page and sign in again.')

  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const detail = await res
      .json()
      .then((j: { error?: string }) => j.error)
      .catch(() => null)
    throw new RunError(detail ?? `Request failed (${res.status}).`)
  }

  return (await res.json()) as T
}

export async function runScan(getToken: TokenFn): Promise<ScanResult> {
  return post<ScanResult>('/api/agent/scan', {}, getToken)
}

export type StageProgress = (stage: number, note: string) => void

/**
 * Run stages 2 through 5 for one hull, then assemble the result.
 *
 * Stage 6 is not run. It is the human's.
 */
export async function runVessel(
  vessel: Vessel,
  getToken: TokenFn,
  onProgress: StageProgress,
): Promise<{ run: VesselRun; events: AgentEvent[] }> {
  const applicable = applicableRecords(vessel).length

  onProgress(2, 'extracting obligations')
  const { requirements } = await post<{ requirements: Requirement[] }>(
    '/api/agent/vessel',
    { vesselId: vessel.id, stage: 2 },
    getToken,
  )
  if (requirements.length === 0) {
    throw new RunError(`No obligations survived validation for ${vessel.name}.`)
  }

  onProgress(3, 'assigning to hull')
  const { assignment } = await post<{ assignment: { summary: string; drivers: string[] } }>(
    '/api/agent/vessel',
    { vesselId: vessel.id, stage: 3, requirements },
    getToken,
  )

  onProgress(4, 'generating actions')
  const { actions } = await post<{ actions: ComplianceAction[] }>(
    '/api/agent/vessel',
    { vesselId: vessel.id, stage: 4, requirements },
    getToken,
  )

  onProgress(5, 'validating evidence')
  const { evidence } = await post<{ evidence: EvidenceItem[] }>(
    '/api/agent/vessel',
    { vesselId: vessel.id, stage: 5, requirements, actions },
    getToken,
  )

  const approvals = buildApprovals(evidence, actions)

  const run = buildVesselRun({
    vessel,
    recordsIndexed: CORPUS.length,
    applicableRecordCount: applicable,
    requirements,
    assignmentSummary: assignment.summary,
    actions,
    evidence,
    approvals,
  })

  return { run, events: buildEvents(vessel, run, new Date()) }
}

// ── Uploaded evidence ────────────────────────────────────────────────────────

export interface UploadVerdict {
  verdict: 'accepted' | 'rejected' | 'pending'
  reason: string
  documentType: string
  concerns: string[]
}

export const ACCEPTED_UPLOAD_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
] as const

/** Vercel caps a function request body around 4.5 MB. Refuse early and clearly. */
export const MAX_UPLOAD_BYTES = 4_000_000

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new RunError('Could not read that file.'))
    reader.onload = () => {
      const result = String(reader.result)
      // strip the "data:<type>;base64," prefix
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.readAsDataURL(file)
  })
}

export async function validateUpload(
  args: { vessel: Vessel; actionText: string; sourceId: string; file: File },
  getToken: TokenFn,
): Promise<UploadVerdict> {
  const { vessel, actionText, sourceId, file } = args

  if (!ACCEPTED_UPLOAD_TYPES.includes(file.type as (typeof ACCEPTED_UPLOAD_TYPES)[number])) {
    throw new RunError('Upload a PDF, PNG, JPEG or WebP.')
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new RunError('That file is over the 4 MB limit for this demo.')
  }

  return post<UploadVerdict>(
    '/api/agent/evidence',
    {
      vesselId: vessel.id,
      actionText: actionText.slice(0, 200),
      sourceId,
      filename: file.name.slice(0, 200),
      mediaType: file.type,
      data: await toBase64(file),
    },
    getToken,
  )
}
