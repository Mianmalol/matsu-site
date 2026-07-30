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
import { DEMO_MAILTO } from '@/data'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

/** Clerk keys are `pk_test_…` / `pk_live_…`; anything else is a misconfiguration. */
export const AUTH_CONFIGURED = typeof PUBLISHABLE_KEY === 'string' && PUBLISHABLE_KEY.startsWith('pk_')

// ── Multi-domain ────────────────────────────────────────────────────────────
//
//  Two production origins serve this same build: www.mymatzu.com is primary and
//  www.matsunow.com is a Clerk satellite. Clerk accepts functions for both
//  `isSatellite` and `domain`, so one bundle decides per-hostname at runtime
//  rather than needing a second deployment or a per-domain env var.
//
//  Signing in from the satellite bounces through the primary and returns. That
//  is how Clerk satellites work and config can't hide it.
//
//  These MUST be exact-match. localhost and *.vercel.app previews are neither
//  primary nor satellite, and if the predicate were written as "not primary"
//  every preview and local session would start redirecting to www.mymatzu.com.

const PRIMARY_HOST = 'www.mymatzu.com'
const SATELLITE_HOST = 'www.matsunow.com'

/**
 * Satellites only exist on the Clerk Production instance, so the behaviour is
 * gated on a live key.
 *
 * This matters for correctness, not tidiness. Claiming to be a satellite against
 * an instance with no satellite registered makes Clerk attempt a handshake that
 * fails, so auth would break on matsunow.com. A development instance is instead
 * permissive about unknown origins, so with a test key both hosts work as plain
 * origins. Swap in the pk_live_ key and satellite routing turns itself on.
 */
const SATELLITES_ENABLED = PUBLISHABLE_KEY?.startsWith('pk_live_') ?? false

const isSatelliteHost = (url: URL) => SATELLITES_ENABLED && url.hostname === SATELLITE_HOST

/**
 * On the satellite, Clerk's sign-in URLs must be absolute and point at the
 * primary. Everywhere else — primary, previews, localhost — relative paths keep
 * the flow on the current origin.
 */
const onSatelliteNow = () =>
  SATELLITES_ENABLED && typeof window !== 'undefined' && window.location.hostname === SATELLITE_HOST

const signInUrl = () => (onSatelliteNow() ? `https://${PRIMARY_HOST}/sign-in` : '/sign-in')
const signUpUrl = () => (onSatelliteNow() ? `https://${PRIMARY_HOST}/sign-up` : '/sign-up')

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
  layout: {
    // Clerk renders the logo set in its own dashboard, which defaults to
    // Clerk's mark — so the card opened under an orange logo belonging to our
    // auth vendor. AuthShell already puts the Matsu wordmark directly above the
    // card, so the fix is to drop Clerk's rather than swap the image and end up
    // with two logos stacked.
    logoPlacement: 'none' as const,
  },
}

/**
 * Card titles.
 *
 * Clerk's defaults interpolate {{applicationName}} from the instance name set
 * in its dashboard, which is not something this repo controls and drifted to
 * the vendor's own branding. Naming the product here means the sign-in page
 * says Matsu no matter what the dashboard is set to, and it moves with the
 * code rather than living in someone's browser tab.
 */
const localization = {
  signIn: {
    start: {
      title: 'Sign in to Matsu',
      subtitle: 'Continue to the fleet compliance demo.',
    },
  },
  signUp: {
    start: {
      title: 'Create your Matsu account',
      subtitle: 'Continue to the fleet compliance demo.',
    },
  },
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!AUTH_CONFIGURED) return <>{children}</>
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY as string}
      // Without these, Clerk redirects to its hosted Account Portal instead of
      // the in-app routes.
      signInUrl={signInUrl()}
      signUpUrl={signUpUrl()}
      isSatellite={isSatelliteHost}
      domain={url => (isSatelliteHost(url) ? SATELLITE_HOST : '')}
      appearance={appearance}
      localization={localization}
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
 *
 * `size` matches the avatar to the slot it sits in — the demo's sidebar footer
 * budgets 24px, against Clerk's default 28.
 *
 * The popover comes from @clerk/clerk-js, which loads from the CDN at runtime
 * and so can't be inspected here. The demo shell is `h-dvh overflow-hidden`, so
 * whether the menu clips depends on how clerk-js positions it — verified in the
 * browser, not assumed. If it ever does clip, the fix is to lift this out of the
 * overflow context rather than to loosen the shell.
 */
export function AccountButton({ size = 28 }: { size?: number }) {
  if (!AUTH_CONFIGURED) return null
  return (
    <UserButton
      afterSignOutUrl="/"
      appearance={{ elements: { userButtonAvatarBox: { width: size, height: size } } }}
    />
  )
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
              href={DEMO_MAILTO}
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
