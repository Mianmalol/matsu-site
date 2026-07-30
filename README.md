# Matsu AI · marketing site

Landing page for Matsu AI: AI-driven compliance and automated reporting for shipping companies
and maritime operators. Includes the gated product demo at `/demo`.

Built with React 19, Vite, and Tailwind CSS v4. Marketing sections live in `src/sections/`
and compose in `src/pages/Marketing.tsx`; the demo is `src/demo/DemoApp.tsx`.

## Develop

```sh
npm install
npm run dev
```

## Checks

```sh
npm run typecheck    # tsc --noEmit; also runs as part of build
npm run check:fleet  # enforces the fleet data rule below
npm run build        # typecheck, then output to dist/
npm run preview      # serve the production build locally
```

`npm run preview` does **not** read `vercel.json`, so it cannot exercise the `/demo` rewrite or
the `noindex` headers. Those only work on a real Vercel deployment.

## Fleet data: real identities, illustrative state

`src/data/pilFleet.ts` holds 109 real, publicly published Pacific International Lines vessel
identities — name, flag, build year, TEU. It carries **no** compliance state, so nothing reading
that table alone can render a real hull compliant or deficient.

Two surfaces use those names, and they are held to different standards.

**The marketing page (`src/sections/`) stays verdict-free.** It is public, indexed, and read
without any product chrome around it, so a status dot there reads as a factual claim. Real hulls
get applicability instead — `src/data/applicability.ts` derives "84 obligations apply to an
ultra-large container vessel on the Singapore register" from published attributes. That is a
statement about the rulebook, not about anything PIL has done.

**The demo (`src/demo/`) shows illustrative pipeline state against real names.** It is a faithful
port of the Figma Make export, gated behind auth, `noindex`'d, and carries a `Demo data` chip in
its top bar. This is a deliberate exemption, not an oversight.

One rule holds everywhere: **no named individual may be presented as a PIL employee.** A ship's
simulated status inside a labelled demo is one thing; inventing a person at a real company is
another. The export named a DPA; both places it appeared now show the role only.

`npm run check:fleet` enforces all three: verdict vocabulary near a real name in `src/sections/`,
a state field landing in `pilFleet.ts`, or a named person in a PIL role anywhere.

## Auth

Clerk, via the Vercel Marketplace integration. `src/auth/AuthGate.tsx` detects configuration
rather than trusting a flag: without `VITE_CLERK_PUBLISHABLE_KEY`, `ClerkProvider` never mounts,
so `/demo` shows a notice and the marketing page still works instead of white-screening.

**The prefix matters.** Vite only exposes `VITE_`-prefixed variables to the browser, and Clerk's
integration sets the Next.js-flavoured `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. A `VITE_`-prefixed
copy of the same `pk_` value is required. If the gate is stuck on the notice, check that first,
there is no other symptom. `CLERK_SECRET_KEY` is server-only and is never read here.

`<SignedIn>` withholds UI, not code. The demo chunk is lazy-loaded but still publicly fetchable,
so this is funnel friction rather than confidentiality. Acceptable because the fleet data is
already public; anything genuinely private would need an authenticated endpoint.

## Routing

Client-side routing is hand-rolled in `src/lib/router.tsx`, roughly 50 lines against the History
API. A router dependency would have about doubled the dependency count of a repo that hand-rolls
its icons, charts, and animations. Routes: `/`, `/demo`, `/sign-in/*`, `/sign-up/*`.

`vercel.json` enumerates its rewrites instead of using a catch-all. A catch-all would send every
unmatched path to `index.html`, so typos and missing assets would return a 200 HTML page instead
of a 404. If you add a route, add it to `vercel.json` too, or its deep links will 404.

`noindex` is set with `X-Robots-Tag` response headers, not a React effect. `index.html` is shared
by every route, and a crawler reads the response before any JS runs.

Note that `vercel.json` rejects unknown properties, including `"//"` pseudo-comment keys. Schema
validation happens server-side at deploy time and fails the build with a 0ms build and no logs;
`vercel build` locally will not catch it.

## Deploy

Hosted on Vercel. Every push to `main` auto-deploys to production, so work on a branch. Pushing
any branch creates a preview deployment. Deployment Protection is on, so preview URLs require a
Vercel login.

## Photography

`src/data.ts` has an `IMAGES` object with empty slots for licensed maritime photos. Only `harbor`
is still wired up (`src/sections/Harbor.tsx`); the components that consumed the others were
removed. Paste a URL into a slot and it renders behind that section's vector scene with a navy
wash. Empty slots fall back to the coded scene.
