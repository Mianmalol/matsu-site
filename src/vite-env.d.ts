/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Clerk publishable key. Must carry the VITE_ prefix: Vite only exposes
   * VITE_-prefixed vars to the browser, and the Clerk Vercel integration may
   * set a bare CLERK_PUBLISHABLE_KEY that never reaches the client.
   *
   * Public by design. CLERK_SECRET_KEY must never appear here.
   */
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
