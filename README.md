# Matsu AI

Landing page for Matsu AI — AI-driven compliance and automated reporting for shipping companies
and maritime operators — plus a **working** product demo at `/demo`.

React 19, Vite, Tailwind CSS v4. Marketing sections live in `src/sections/` and compose in
`src/pages/Marketing.tsx`. The demo is a different animal and has its own section below.

## Develop

```sh
npm install
npm run dev        # marketing page + demo UI. Does NOT serve api/ — the agents will fail.
npm run dev:full   # vercel dev: same, plus the Vercel Functions in api/
```

`npm run dev` is Vite alone. It cannot serve `api/`, so anything that calls an agent returns a
404 in that mode. Use `npm run dev:full` when working on the pipeline.

## Checks

```sh
npm run typecheck    # both tsconfigs — the SPA and the functions
npm run check:fleet  # honesty and fixture-integrity checks, see below
npm run build        # typecheck, check:fleet, then vite build
npm run seed:agents  # one real agent run -> src/data/canonicalRun.json
```

`tsconfig.json` covers `src/` and `shared/`; `tsconfig.api.json` covers `api/`, `shared/` and
`scripts/`. Both run under `npm run typecheck`, because the Vite build never sees `api/` and a
function that does not compile would otherwise deploy green and fail at request time.

`npm run preview` does **not** read `vercel.json`, so it cannot exercise the `/demo` rewrite,
the `noindex` headers, or the API routes. Those need a real deployment or `vercel dev`.

---

## The demo

Five invented Matsu Lines hulls, a committed corpus of real IMO instruments, and five agents
that genuinely run against it. Stage 6 is a human decision and no model touches it.

```
shared/corpus.ts      55 records: SOLAS, MARPOL I–VI, ISM, ISPS, STCW, MLC, BWM,
                      CII/EEXI, AFS, Load Lines, Hong Kong, EU MRV, Paris/Tokyo MoU
shared/fleet.ts       the five hulls
shared/assemble.ts    raw stage output -> the shapes the UI renders
api/agent/scan.ts     stage 1, fleet-wide
api/agent/vessel.ts   stages 2–5, one hull and one stage per invocation
api/agent/evidence.ts uploaded-file validation
api/_lib/stages.ts    the agents themselves
api/_lib/guard.ts     what stands between model output and the UI
src/demo/state.ts     canonical run + this session's overlay
src/demo/runner.ts    browser-side orchestration
```

### The six stages

| # | Stage | Who does it |
|---|---|---|
| 1 | Regulation Scanning | Agent, fleet-wide. Indexes the corpus, diffs it against the previous version. |
| 2 | Requirement Extraction | Agent, per hull. Turns records into discrete obligations, each citing its source. |
| 3 | Vessel Assignment | **Code** decides applicability. The agent explains the resulting profile. |
| 4 | Action Assignment | Agent, per hull. Obligations become dated tasks with an expected evidence type. |
| 5 | Evidence Collection | Agent, per hull. Generates submissions and validates them. Real uploads use the same validator. |
| 6 | DPA Approval | **A human.** Approve or return. No model call exists for this stage. |

### Why applicability is not a model call

Deciding which regulations bite for which hull is the step where being wrong is worst and being
confident is easiest. It is therefore decided in `appliesTo()` in `shared/corpus.ts`, from facts
the `Vessel` actually carries — type, gross tonnage, fuel, build year, trading area. The agents
only ever see records already known to apply.

That is what makes the fleet diverge honestly rather than by template:

| Hull | Applicable records | What sets it apart |
|---|---|---|
| Matsu Solace | 50 | The only chemical tanker: MARPOL Annex II, P&A Manual, ORB Part II |
| Matsu Aurora | 50 | The only gas-fuelled hull: the IGF Code |
| Matsu Meridian | 49 | EU MRV and Paris MoU, from trading Asia–Europe |
| Matsu Kestrel | 48 | The oldest hull, so EEXI rather than EEDI |
| Matsu Cordillera | 47 | Bulk carrier, Tokyo MoU only, no Annex II, no gas |

If a rule bites on a fact the `Vessel` type does not carry, add the fact to `Vessel` first. Do
not approximate it in prose and hope the model infers it.

### The guard

Every model response passes through `api/_lib/guard.ts` before it becomes state:

- **Citations are checked against the corpus.** A schema proves the model returned a *string* in
  the `sourceId` field and nothing at all about whether the regulation exists. A requirement
  citing `MARPOL-VII-99` validates against Zod and is dropped here. So is one citing a real
  record that does not apply to that hull.
- **IDs are hash-derived, never model-authored.** Model-written ids drift on every run and
  silently break every reference pointing at them.
- **Dangling references are dropped**, not rendered as empty rows.

Whatever the guard throws away is counted and reported rather than swallowed — `npm run
seed:agents` prints it per stage.

### State: canonical underneath, session overlay on top

`src/data/canonicalRun.json` is produced by `npm run seed:agents` and committed. It ships in the
bundle, so opening `/demo` costs zero tokens and shows a populated fleet immediately.

Everything a visitor does — approvals, returns, uploads, re-runs — lands in a session overlay in
`sessionStorage` and never touches canonical. One visitor cannot change what the next one sees.

**Re-running is always a whole hull, never a single stage.** Stage 4 depends on stage 2's
requirement ids and stage 5 on stage 4's action ids, so re-running one stage alone leaves later
stages pointing at ids that no longer exist. A re-run replaces the hull's entire run and drops
approval decisions attached to the evidence it superseded.

The committed run records `corpusVersion` and a content hash of the corpus. `check:fleet` fails
the build when they drift, because a fixture that disagrees with the corpus it claims to derive
from is worse than no fixture. The repo currently carries an unseeded placeholder
(`"seeded": false`), which skips those checks until you run the seed.

### Why the run is not one streamed request

The obvious design is one function that streams a whole fleet run. It does not work on Vercel:
**SSE does not extend a function's `maxDuration`.** Heartbeats keep the socket open while the
platform kills the invocation anyway, so a 21-call run is a coin flip against the deadline.

So each invocation does one stage for one hull and returns, and the browser orchestrates. Every
request finishes in seconds, a failure costs one stage rather than the run, and progress is
observable because each stage boundary is a real response.

The trade: stage N+1's input travels back through the client, so the server treats it as
untrusted — re-validated, bounded by `LIMITS`, and stripped to known fields before any of it
reaches a prompt. Applicability is re-derived server-side from the vessel id, so a client cannot
widen the obligation set by lying about what stage 2 returned.

### Auth is not decorative

`<SignedIn>` withholds UI in the browser. It has no bearing on whether a request to a Vercel
Function runs. Every route in `api/` verifies a Clerk session JWT via `CLERK_SECRET_KEY` before
it reads a body or reaches a model — without that, `/api/agent/*` is an open endpoint that turns
anonymous HTTP requests into AI Gateway spend, and "the demo is behind a login" is irrelevant to
anyone with curl.

Per-user rate limiting in `api/_lib/auth.ts` is per warm instance, not global, so it is a
courtesy limit rather than the spend control. The real ceilings are the per-request bounds in
`guard.ts` and a spend limit configured on the Gateway itself. Doing better needs shared storage,
which this project deliberately does not provision.

### Model access

Via the Vercel AI Gateway. The AI SDK's default provider is the Gateway, so the bare model
string in `api/_lib/model.ts` routes through it with no client construction. Credentials resolve
without any code: the deployment's OIDC token on Vercel, the `vercel env pull` token locally
(**it expires** — re-pull when local agent calls start failing auth and nothing else changed),
or `AI_GATEWAY_API_KEY` anywhere else.

**The Gateway free tier carries no Claude models and rate-limits open models after roughly two
calls.** A fleet run is 21 calls, so the free tier cannot complete one. Either top up Gateway
credits or point `MODEL` at a direct provider.

### Uploaded evidence

The one place a model reads something the operator supplied, and therefore the one real
prompt-injection surface. A PDF can contain text addressed to the model. Two defences: the
system prompt states that document content is data and never instruction, and any instruction
found inside a document is itself a finding to report; and the verdict returns through a schema,
so the model cannot answer with free-form text the UI would render as a decision.

Bytes are checked against the declared MIME type rather than trusted. The cap is 4 MB because
Vercel caps a function request body around 4.5 MB — a real product would presign a
direct-to-storage upload; this refuses large scans rather than truncating them silently.

### Honesty

- The fleet, the operator and every IMO number are **invented**.
- The instruments are **real**; the summaries are written for this repo, not quoted from IMO
  publications, which are copyrighted and not ours to redistribute. They are therefore not
  authoritative and may be incomplete.
- Stage 1 diffs **corpus versions**, not the world. A committed corpus cannot know what IMO
  published last week and the prompt says so explicitly.
- Agent-generated evidence is labelled **synthetic** everywhere it appears. A system that both
  writes the evidence and grades it is a workflow illustration, not assurance.
- Nothing in the demo is legal, class, flag-state or compliance advice.

`npm run check:fleet` enforces the first point mechanically, plus: no named individual in a
company-officer role, and — once seeded — that every citation in the committed run resolves to a
real corpus record that genuinely applies to the hull it is attached to.

---

## Auth

Clerk, via the Vercel Marketplace integration. `src/auth/AuthGate.tsx` detects configuration
rather than trusting a flag: without `VITE_CLERK_PUBLISHABLE_KEY`, `ClerkProvider` never mounts,
so `/demo` shows a notice and the marketing page still works instead of white-screening.

**The prefix matters.** Vite only exposes `VITE_`-prefixed variables to the browser, and Clerk's
integration sets the Next.js-flavoured `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. A `VITE_`-prefixed
copy of the same `pk_` value is required. If the gate is stuck on the notice, check that first,
there is no other symptom.

`CLERK_SECRET_KEY` is server-only, never reaches the bundle, and is what `api/` verifies tokens
against. A deployment without it fails closed with a 503 rather than silently becoming open.

## Routing

Client-side routing is hand-rolled in `src/lib/router.tsx`, roughly 50 lines against the History
API. A router dependency would have about doubled the dependency count of a repo that hand-rolls
its icons, charts, and animations. Routes: `/`, `/demo`, `/sign-in/*`, `/sign-up/*`.

`vercel.json` enumerates its rewrites instead of using a catch-all. A catch-all would send every
unmatched path to `index.html`, so typos and missing assets would return a 200 HTML page instead
of a 404 — and it could shadow `/api/*` depending on ordering. If you add a page route, add it to
`vercel.json` too. Do **not** add rewrites for `/api/*`; those are functions, not pages.

`noindex` is set with `X-Robots-Tag` response headers, not a React effect. `index.html` is shared
by every route, and a crawler reads the response before any JS runs.

Note that `vercel.json` rejects unknown properties, including `"//"` pseudo-comment keys. Schema
validation happens server-side at deploy time and fails the build with a 0ms build and no logs;
`vercel build` locally will not catch it.

## Deploy

Hosted on Vercel. Every push to `main` auto-deploys to production, so work on a branch. Pushing
any branch creates a preview deployment. Deployment Protection is on, so preview URLs require a
Vercel login.

## Marketing-page fleet

`src/data/demoFleet.ts` holds a separate invented fleet ("Meridian Line", 12 hulls) used by the
public marketing page. It predates the demo rebuild and is unrelated to Matsu Lines. If the two
should be one fleet, that is a deliberate change to make, not an accident to fix quietly.

## Photography

`src/data.ts` has an `IMAGES` object with empty slots for licensed maritime photos. Only `harbor`
is still wired up (`src/sections/Harbor.tsx`). Paste a URL into a slot and it renders behind that
section's vector scene with a navy wash. Empty slots fall back to the coded scene.
