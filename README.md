# Matsu AI — marketing site

Landing page for Matsu AI: AI-driven compliance and automated reporting for shipping companies and maritime operators.

Built with React 19, Vite, and Tailwind CSS v4. The whole page lives in `src/App.tsx`.

## Develop

```sh
npm install
npm run dev
```

## Build

```sh
npm run build    # outputs to dist/
npm run preview  # serve the production build locally
```

## Deploy

Hosted on Vercel; every push to `main` auto-deploys. Vercel detects the Vite setup automatically, no config needed.

## Photography

`src/App.tsx` has an `IMAGES` object at the top with empty slots for licensed maritime photos (hero, bridge, deck, engine, docs, port, harbor). Paste a URL into a slot and it renders behind that section's vector scene with a navy wash. Empty slots fall back to the coded scene.
