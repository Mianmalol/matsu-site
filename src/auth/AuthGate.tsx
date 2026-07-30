// ═══════════════════════════════════════════════════════════════════════════
//  AUTH GATE · Clerk
//
//  Configuration is detected, not hand-flipped. If VITE_CLERK_PUBLISHABLE_KEY
//  is absent the gate fails closed: /demo shows the notice, the demo never
//  renders, and the marketing page keeps working because ClerkProvider is not
//  mounted at all. A deploy that forgets the env var degrades instead of
//  white-screening.
//
//  The VITE_ prefix is load-bearing. Vite only exposes VITE_-prefixed vars to
//  the browser, and the Clerk Vercel integration may set a bare
//  CLERK_PUBLISHABLE_KEY, which would silently never reach the client. If the
//  gate is stuck on the notice after provisioning, check that first.
//  CLERK_SECRET_KEY is server-only and must never be read here.
//
//  What this gate is: <SignedIn> withholds UI, not code. The demo chunk is
//  lazy-loaded but still publicly fetchable, so this is funnel friction rather
//  than confidentiality. Acceptable here because the fleet data is PIL's own
//  published list. Anything genuinely private would need to be served from an
//  authenticated endpoint.
// ═══════════════════════════════════════════════════════════════════════════

import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, UserButton } from '@clerk/clerk-react'
import { Wordmark } from '@/components/ui'
import { Link } from '@/lib/router'
import { CONTACT_EMAIL } from '@/data'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

/** Clerk keys are `pk_test_…` / `pk_live_…`; anything else is a misconfiguration. */
export const AUTH_CONFIGURED = typeof PUBLISHABLE_KEY === 'string' && PUBLISHABLE_KEY.startsWith('pk_')

/** Clerk's own UI, themed to the site's palette. */
const appearance = {
  variables: {
    colorPrimary: '#167db7',
    colorText: '#071a2c',
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    borderRadius: '0.375rem',
    fontFamily: "'Inter Variable', 'Inter', sans-serif",
  },
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!AUTH_CONFIGURED) return <>{children}</>
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY as string}
      // Without these, Clerk redirects to its hosted Account Portal instead of
      // the in-app routes.
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={appearance}
    >
      {children}
    </ClerkProvider>
  )
}

/** Renders children only for a signed-in user; anyone else is sent to sign-in. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  if (!AUTH_CONFIGURED) return <AuthNotConfigured />
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

/**
 * Account menu for the demo chrome, which is also where sign-out lives.
 * Renders nothing when auth is not configured.
 */
export function AccountButton() {
  if (!AUTH_CONFIGURED) return null
  return <UserButton afterSignOutUrl="/" />
}

/** Shell around Clerk's sign-in / sign-up cards. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-navy flex flex-col">
      <div className="px-6 py-5">
        <Link to="/" aria-label="Matsu home"><Wordmark light /></Link>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20 gap-6">
        {children}
        <Link to="/" className="text-[13px] text-mist/70 hover:text-white transition-colors">
          Back to the site
        </Link>
      </div>
    </div>
  )
}

export function AuthNotConfigured() {
  return (
    <div className="min-h-dvh bg-navy text-white flex flex-col">
      <div className="px-6 py-5">
        <Link to="/" aria-label="Matsu home"><Wordmark light /></Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 pb-24">
        <div className="max-w-[440px]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-seacyan mb-5">
            Sign in required
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] leading-tight mb-5">
            The demo is behind an account.
          </h1>
          <p className="text-[15px] text-mist/80 leading-relaxed mb-8">
            Accounts are not switched on yet. Once they are, this page becomes the sign-up step
            and drops you straight into the fleet dashboard.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Matsu%20demo%20request`}
              className="bg-white text-navy text-[15px] font-semibold px-7 py-3.5 rounded-md hover:bg-mist transition-colors"
            >
              Request access
            </a>
            <Link to="/" className="text-[14px] text-mist/80 hover:text-white transition-colors">
              Back to the site
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
