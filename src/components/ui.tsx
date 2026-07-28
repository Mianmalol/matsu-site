import { useEffect, useRef, useState } from 'react'
import { clamp01, easeOut } from '@/lib/hooks'

/** Fades/slides children in when scrolled into view. */
export function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && setInView(true)),
      { threshold: 0.18 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={`reveal ${inView ? 'in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

export function CountUp({ target, suffix = '', duration = 1600, plain = false }: { target: number; suffix?: string; duration?: number; plain?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting || started.current) return
        started.current = true
        const t0 = performance.now()
        const tick = (t: number) => {
          const p = clamp01((t - t0) / duration)
          setVal(Math.round(easeOut(p) * target))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [target, duration])
  return <span ref={ref}>{plain ? String(val) : val.toLocaleString()}{suffix}</span>
}

// ═══════════════════════════════════════════════════════════════════════════
//  Shared bits
// ═══════════════════════════════════════════════════════════════════════════

export function Label({ children, tone = 'ocean' }: { children: React.ReactNode; tone?: 'ocean' | 'cyan' | 'steel' }) {
  const color = tone === 'cyan' ? 'text-seacyan' : tone === 'steel' ? 'text-steel' : 'text-ocean'
  return (
    <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${color} mb-5`}>
      {children}
    </p>
  )
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M4 20 Q8 15, 12 20 Q15 23.5, 18 20 Q22 15, 26 20" stroke={light ? '#ffffff' : '#0d5c91'} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M4 13 Q8 8, 12 13 Q15 16.5, 18 13 Q22 8, 26 13" stroke={light ? '#59b7c8' : '#167db7'} strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span className={`font-semibold text-[15px] tracking-[0.26em] ${light ? 'text-white' : 'text-navy'}`}>MATSU AI</span>
    </span>
  )
}

export function PhotoLayer({ src, wash = 'rgba(7,26,44,0.45)' }: { src: string; wash?: string }) {
  if (!src) return null
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <img src={src} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: wash }} />
    </div>
  )
}
