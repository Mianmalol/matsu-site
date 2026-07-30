// Content hash of the corpus, shared by the seed script (which stamps it into
// the committed run) and the honesty check (which fails the build when the two
// disagree).
//
// It lives in its own module rather than in shared/corpus.ts because it needs
// node:crypto, and shared/corpus.ts is imported by the browser bundle. It is
// not in seed-run.ts either: importing from there would execute the seed run as
// a side effect of asking for a hash.

import { createHash } from 'node:crypto'
import { CORPUS } from '../shared/corpus.js'

export function corpusHash(): string {
  return createHash('sha256').update(JSON.stringify(CORPUS)).digest('hex').slice(0, 12)
}
