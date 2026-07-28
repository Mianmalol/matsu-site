import { useEffect, useState } from 'react'

// ═══════════════════════════════════════════════════════════════════════════
//  Hooks
// ═══════════════════════════════════════════════════════════════════════════

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

export function useScrollY() {
  const [y, setY] = useState(0)
  useEffect(() => {
    let raf = 0
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setY(window.scrollY))
    }
    window.addEventListener('scroll', on, { passive: true })
    on()
    return () => {
      window.removeEventListener('scroll', on)
      cancelAnimationFrame(raf)
    }
  }, [])
  return y
}

/** 0→1 progress through a tall sticky section. */
export function useProgress(ref: React.RefObject<HTMLElement | null>) {
  const [p, setP] = useState(0)
  useEffect(() => {
    let raf = 0
    const calc = () => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = el.offsetHeight - window.innerHeight
      if (total <= 0) return setP(1)
      const passed = Math.min(Math.max(-rect.top, 0), total)
      setP(passed / total)
    }
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(calc)
    }
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    calc()
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
      cancelAnimationFrame(raf)
    }
  }, [ref])
  return p
}

export const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1)
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
