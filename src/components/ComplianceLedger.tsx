import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/lib/hooks'

// ═══════════════════════════════════════════════════════════════════════════
//  Compliance ledger — rows type in and resolve to cited verdicts,
//  demonstrating the deterministic core + cited audit trail claim.
// ═══════════════════════════════════════════════════════════════════════════

export interface LedgerRow {
  t: string
  who: string
  e: string
  verdict: string
  cite: string
}

// ticks reserved after a row finishes typing before its verdict chip lands
const CHIP_PAUSE = 14
const TICK_MS = 18

function rowBudget(r: LedgerRow) {
  return r.e.length + CHIP_PAUSE
}

export default function ComplianceLedger({ rows }: { rows: LedgerRow[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [started, setStarted] = useState(false)
  const [ticks, setTicks] = useState(0)
  const total = rows.reduce((a, r) => a + rowBudget(r), 0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      es => es.forEach(e => e.isIntersecting && setStarted(true)),
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!started || reduced) return
    const iv = setInterval(() => {
      setTicks(c => {
        if (c >= total) {
          clearInterval(iv)
          return c
        }
        return c + 1
      })
    }, TICK_MS)
    return () => clearInterval(iv)
  }, [started, reduced, total])

  const done = reduced || ticks >= total
  let remaining = reduced ? total : ticks

  return (
    <div ref={ref} className="rounded-xl border border-white/12 bg-white/[0.04] overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <span className="text-sm font-semibold text-mist">Audit ledger · every verdict cited</span>
        <span className="text-[10px] font-mono text-seacyan tracking-[0.14em]">SAMPLE RECORD</span>
      </div>

      {/* Complete transcript for screen readers; the animation below is decorative. */}
      <ul className="sr-only">
        {rows.map(r => (
          <li key={r.t}>
            {r.t}, {r.who}: {r.e}. {r.verdict}, per {r.cite}.
          </li>
        ))}
      </ul>

      <div className="p-6 space-y-5" aria-hidden="true">
        {rows.map((r, i) => {
          const alloc = Math.max(0, Math.min(rowBudget(r), remaining))
          remaining -= rowBudget(r)
          const typed = Math.min(r.e.length, alloc)
          const rowStarted = alloc > 0
          const typing = rowStarted && typed < r.e.length
          const chipIn = alloc >= r.e.length + Math.min(CHIP_PAUSE - 2, 10)
          return (
            <div key={r.t} className="flex gap-4" style={{ opacity: rowStarted ? 1 : 0.25, transition: 'opacity 0.4s ease' }}>
              <div className="flex flex-col items-center">
                <span
                  className="w-2 h-2 rounded-full mt-1.5"
                  style={{ background: chipIn ? '#59b7c8' : 'rgba(220,236,242,0.3)', transition: 'background 0.4s ease' }}
                />
                {i < rows.length - 1 && <span className="w-px flex-1 bg-white/12 mt-1" />}
              </div>
              <div className="pb-1 flex-1 min-w-0">
                <p className="text-[11px] font-mono text-steel">{r.t} · {r.who}</p>
                {/* ghost copy reserves final height; typed copy paints over it */}
                <div className="grid">
                  <p className="col-start-1 row-start-1 invisible text-[13.5px] mt-1">{r.e}</p>
                  <p className="col-start-1 row-start-1 text-[13.5px] text-mist mt-1">
                    {r.e.slice(0, typed)}
                    {typing && <span className="anim-caret inline-block w-[7px] h-[13px] ml-0.5 align-middle bg-seacyan" />}
                  </p>
                </div>
                <div
                  className="mt-2 flex items-center gap-2 flex-wrap"
                  style={{ opacity: chipIn ? 1 : 0, transform: chipIn ? 'none' : 'translateY(4px)', transition: 'opacity 0.35s ease, transform 0.35s ease' }}
                >
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-seacyan/50 text-seacyan tracking-[0.08em]">
                    {r.verdict}
                  </span>
                  <span className="text-[10px] font-mono text-steel tracking-[0.06em]">[{r.cite}]</span>
                </div>
              </div>
            </div>
          )
        })}
        <p
          className="text-[10.5px] font-mono text-steel/80 pt-1"
          style={{ opacity: done ? 1 : 0, transition: 'opacity 0.5s ease' }}
        >
          DETERMINISTIC CORE · EVERY VERDICT CARRIES ITS CITATION
        </p>
      </div>
    </div>
  )
}
