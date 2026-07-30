// ═══════════════════════════════════════════════════════════════════════════
//  Minimal history router
//
//  This site has two routes. Pulling in react-router for that would roughly
//  double the dependency count of a repo that hand-rolls its icons, charts and
//  animations, so navigation is done directly against the History API.
//
//  Deliberate behaviours:
//   · Hash-only links (#cta, #platform) are left entirely alone, so the CSS
//     smooth-scroll and scroll-padding-top in index.css keep working.
//   · Path navigation resets scroll to the top. Browsers restore scroll on
//     popstate, so back/forward keeps its position instead.
//   · A path with a hash (/#platform) scrolls to the target after paint.
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState } from 'react'

function currentPath(): string {
  const p = window.location.pathname
  // Treat /demo and /demo/ as the same route.
  return p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p
}

/** Navigate to a path. No-op if we're already there. */
export function navigate(to: string, opts: { replace?: boolean } = {}) {
  const [path, hash] = to.split('#')
  const target = path || currentPath()

  if (target === currentPath() && !hash) return

  if (opts.replace) window.history.replaceState({}, '', to)
  else window.history.pushState({}, '', to)

  window.dispatchEvent(new PopStateEvent('matsu:navigate'))

  if (hash) {
    // Wait for the new route to paint before looking for the anchor.
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'auto', block: 'start' })
    })
  } else {
    window.scrollTo(0, 0)
  }
}

/** Current pathname, re-rendering on push, pop and replace. */
export function useRoute(): string {
  const [path, setPath] = useState(currentPath)

  useEffect(() => {
    const sync = () => setPath(currentPath())
    window.addEventListener('popstate', sync)
    window.addEventListener('matsu:navigate', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('matsu:navigate', sync)
    }
  }, [])

  return path
}

type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string
  replace?: boolean
}

/**
 * Anchor that routes client-side for in-app paths and behaves like a plain
 * anchor for everything else: hash-only links, mailto:, tel:, external URLs,
 * and any modified click the user expects to open in a new tab.
 */
export function Link({ to, replace, onClick, ...rest }: LinkProps) {
  const handle = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e)
      if (e.defaultPrevented) return

      // Let the browser handle new-tab / download intents.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      // Same-page anchors and non-http schemes stay native.
      if (to.startsWith('#') || to.startsWith('mailto:') || to.startsWith('tel:') || /^[a-z]+:\/\//i.test(to)) return

      e.preventDefault()
      navigate(to, { replace })
    },
    [to, replace, onClick],
  )

  return <a href={to} onClick={handle} {...rest} />
}
