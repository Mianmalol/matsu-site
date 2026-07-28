import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useReducedMotion } from '@/lib/hooks'
import { PhotoLayer } from '@/components/ui'
import { sceneArt } from '@/components/scenes'
import { scenes } from '@/data'

// ═══════════════════════════════════════════════════════════════════════════
//  4 · Interactive ship walkthrough
// ═══════════════════════════════════════════════════════════════════════════

const AUTO_ADVANCE_MS = 5500

export default function Walkthrough() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const [idx, setIdx] = useState(0)
  const [inView, setInView] = useState(false)
  const [paused, setPaused] = useState(false)
  const [stopped, setStopped] = useState(false)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const autoRunning = inView && !paused && !stopped && !reduced
  useEffect(() => {
    if (!autoRunning) return
    const t = setInterval(() => setIdx(i => (i + 1) % scenes.length), AUTO_ADVANCE_MS)
    return () => clearInterval(t)
  }, [autoRunning])

  const select = (i: number) => {
    setStopped(true)
    setIdx(i)
  }
  const onKeyDown = (e: KeyboardEvent) => {
    const last = scenes.length - 1
    let next: number | null = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = idx === last ? 0 : idx + 1
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = idx === 0 ? last : idx - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next !== null) {
      e.preventDefault()
      select(next)
      tabRefs.current[next]?.focus()
    }
  }

  return (
    <section
      id="solutions"
      ref={ref}
      className="relative bg-navy"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="flex flex-col lg:flex-row lg:min-h-[85vh]">
        <div className="relative flex-1 bg-navy flex items-center order-2 lg:order-1">
          <div className="px-6 lg:px-14 xl:pl-[max(3.5rem,calc((100vw-1280px)/2+1.5rem))] py-12 lg:py-16 max-w-xl w-full">
            <div className="grid">
              {scenes.map((s, i) => (
                <div
                  key={s.key}
                  id={`walkthrough-panel-${s.key}`}
                  role="tabpanel"
                  aria-labelledby={`walkthrough-tab-${s.key}`}
                  className="col-start-1 row-start-1 transition-opacity duration-700"
                  style={{ opacity: idx === i ? 1 : 0, pointerEvents: idx === i ? undefined : 'none' }}
                  aria-hidden={idx !== i}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-seacyan mb-6">
                    Aboard the vessel · {String(i + 1).padStart(2, '0')} / {String(scenes.length).padStart(2, '0')} — {s.kicker}
                  </p>
                  <h2 className="font-bold text-white text-3xl md:text-[44px] leading-[1.06] tracking-[-0.02em]">
                    {s.title}
                  </h2>
                  <p className="mt-6 text-mist/75 text-base md:text-lg leading-relaxed">
                    {s.copy}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex gap-2" role="tablist" aria-label="Vessel walkthrough">
              {scenes.map((s, i) => (
                <button
                  key={s.key}
                  ref={el => { tabRefs.current[i] = el }}
                  id={`walkthrough-tab-${s.key}`}
                  role="tab"
                  aria-selected={idx === i}
                  aria-controls={`walkthrough-panel-${s.key}`}
                  aria-label={s.title}
                  tabIndex={idx === i ? 0 : -1}
                  onClick={() => select(i)}
                  onKeyDown={onKeyDown}
                  className="relative h-[14px] flex items-center cursor-pointer"
                >
                  <span
                    className="relative h-[3px] rounded-full overflow-hidden transition-all duration-500"
                    style={{ width: idx === i ? 44 : 20, background: 'rgba(220,236,242,0.25)' }}
                  >
                    {idx === i && (
                      <span
                        key={autoRunning ? `run-${idx}` : `static-${idx}`}
                        className="absolute inset-y-0 left-0 w-full rounded-full origin-left"
                        style={{
                          background: '#59b7c8',
                          animation: autoRunning ? `tabTimer ${AUTO_ADVANCE_MS}ms linear forwards` : 'none',
                          transform: autoRunning ? undefined : 'scaleX(1)',
                        }}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="relative h-[38vh] min-h-[260px] lg:h-auto lg:min-h-0 lg:w-[54%] order-1 lg:order-2 bg-abyss" aria-hidden="true">
          {scenes.map((s, i) => {
            const Art = sceneArt[s.key]
            return (
              <div key={s.key} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: idx === i ? 1 : 0 }}>
                <PhotoLayer src={s.photo} />
                {!s.photo && <Art />}
                <div className="absolute inset-y-0 left-0 w-16 hidden lg:block" style={{ background: 'linear-gradient(to right, #071a2c, rgba(7,26,44,0))' }} />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
