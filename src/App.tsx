import { Suspense, lazy } from 'react'
import { SignIn, SignUp } from '@clerk/clerk-react'
import { useRoute } from '@/lib/router'
import { AuthProvider, AuthGate, AuthShell, AuthNotConfigured, AUTH_CONFIGURED } from '@/auth/AuthGate'
import Marketing from '@/pages/Marketing'

// The demo is a large tree and only reachable behind the gate, so it stays out
// of the initial bundle. Lazy loading is a payload win, not an access control.
const DemoApp = lazy(() => import('@/demo/DemoApp'))

// ═══════════════════════════════════════════════════════════════════════════
//  App · route shell
//
//  Only /, /demo, /sign-in* and /sign-up* exist. vercel.json rewrites exactly
//  those to index.html, so any other path still 404s at the edge rather than
//  quietly rendering the homepage.
// ═══════════════════════════════════════════════════════════════════════════

function Loading({ label }: { label: string }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-white">
      <p className="text-[13px] text-steel">{label}…</p>
    </div>
  )
}

function DemoRoute() {
  return (
    <AuthGate>
      <Suspense fallback={<Loading label="Loading the demo" />}>
        <DemoApp />
      </Suspense>
    </AuthGate>
  )
}

/**
 * `routing="path"` keeps Clerk's multi-step flows on our own URLs. The redirect
 * target is `fallbackRedirectUrl`, not the deprecated `afterSignInUrl` — and
 * "fallback" rather than "force" so that a user bounced here from /demo returns
 * to where they were headed.
 */
function SignInRoute() {
  if (!AUTH_CONFIGURED) return <AuthNotConfigured />
  return (
    <AuthShell>
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/demo" />
    </AuthShell>
  )
}

function SignUpRoute() {
  if (!AUTH_CONFIGURED) return <AuthNotConfigured />
  return (
    <AuthShell>
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/demo" />
    </AuthShell>
  )
}

export default function App() {
  const path = useRoute()

  return (
    <AuthProvider>
      {path === '/demo' ? <DemoRoute />
        : path.startsWith('/sign-in') ? <SignInRoute />
        : path.startsWith('/sign-up') ? <SignUpRoute />
        : <Marketing />}
    </AuthProvider>
  )
}
