import { useRef } from 'react'
import { useProgress, useReducedMotion, clamp01, easeOut } from '@/lib/hooks'
import { Label } from '@/components/ui'
import { floatingDocs, scatter } from '@/data'

// ═══════════════════════════════════════════════════════════════════════════
//  2 · Beneath the surface
// ═══════════════════════════════════════════════════════════════════════════

export default function Depths() {
  const ref = useRef<HTMLElement>(null)
  const raw = useProgress(ref)
  const reduced = useReducedMotion()
  const morph = reduced ? 1 : easeOut(clamp01((raw - 0.22) / 0.5))
  const resolved = morph > 0.55

  return (
    <section ref={ref} className="relative" style={{ height: '220vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center"
        style={{ background: 'linear-gradient(to bottom, #167db7 -6%, #0a2a43 30%, #071a2c 66%, #05101a 100%)' }}>

        <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
          style={{ opacity: 1 - morph * 0.7 }}>
          {[12, 34, 58, 78].map((left, i) => (
            <div key={i} className={reduced ? '' : 'anim-rays'} style={{
              position: 'absolute', top: '-8%', left: `${left}%`, width: '90px', height: '65%',
              background: 'linear-gradient(to bottom, rgba(220,236,242,0.16), rgba(220,236,242,0))',
              transform: 'skewX(-14deg)', animationDelay: `${i * 1.4}s`,
            }} />
          ))}
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className={reduced ? '' : 'anim-particle'} style={{
              position: 'absolute', left: `${(i * 61) % 97}%`, top: `${18 + (i * 37) % 70}%`,
              width: i % 3 ? 2 : 3, height: i % 3 ? 2 : 3, borderRadius: '50%',
              background: 'rgba(220,236,242,0.5)', animationDelay: `${i * 0.7}s`, display: 'inline-block',
            }} />
          ))}
        </div>

        <div className="relative max-w-[1280px] mx-auto px-6 w-full">
          <div className="grid max-w-3xl">
            <div className="col-start-1 row-start-1 transition-opacity duration-700" style={{ opacity: resolved ? 0 : 1 }} aria-hidden={resolved}>
              <Label tone="cyan">Beneath the surface</Label>
              <h2 className="font-bold text-white text-3xl md:text-[52px] leading-[1.05] tracking-[-0.02em]">
                Maritime compliance is not one document.
              </h2>
              <p className="mt-5 text-base md:text-lg text-mist/70 leading-relaxed max-w-xl">
                It is a continuously changing system of regulations, evidence, deadlines, inspections, people, and operational risk.
              </p>
            </div>
            <div className="col-start-1 row-start-1 transition-opacity duration-700" style={{ opacity: resolved ? 1 : 0 }} aria-hidden={!resolved}>
              <Label tone="cyan">One intelligent system</Label>
              <h2 className="font-bold text-white text-3xl md:text-[52px] leading-[1.05] tracking-[-0.02em]">
                Turn complexity into operational clarity.
              </h2>
              <p className="mt-5 text-base md:text-lg text-mist/70 leading-relaxed max-w-xl">
                Centralize every vessel, certificate, inspection, regulation, deadline, and compliance action in one intelligent platform.
              </p>
            </div>
          </div>

          <div className="relative mt-12 h-[42vh] min-h-[320px]" aria-hidden="true">
            <div className="absolute inset-0 rounded-xl border transition-colors duration-700"
              style={{ borderColor: `rgba(89,183,200,${morph * 0.45})`, background: `rgba(10,42,67,${morph * 0.4})` }} />
            {floatingDocs.map((d, i) => {
              const s = scatter[i]
              const col = i % 4
              const row = Math.floor(i / 4)
              const tx = (col - 1.5) * 24
              const ty = (row - 0.5) * 40
              const x = s.x + (tx - s.x) * morph
              const yy = s.y + (ty - s.y) * morph
              const r = s.r * (1 - morph)
              const drift = reduced ? 0 : Math.sin(raw * 22 + i * 1.7) * 12 * (1 - morph)
              return (
                <div key={i} className="hidden sm:block absolute w-[230px] rounded-md px-4 py-3 border backdrop-blur-sm"
                  style={{
                    left: `calc(50% + ${x}% - 115px)`, top: `calc(50% + ${yy}% - 30px)`,
                    transform: `rotate(${r}deg) translateY(${drift}px)`,
                    background: resolved ? 'rgba(220,236,242,0.06)' : 'rgba(255,255,255,0.06)',
                    borderColor: resolved ? 'rgba(89,183,200,0.45)' : 'rgba(255,255,255,0.14)',
                    transition: 'background 0.6s ease, border-color 0.6s ease',
                  }}>
                  <p className="text-[12.5px] font-semibold text-mist truncate">{d.title}</p>
                  <p className="text-[10.5px] font-mono mt-0.5 transition-colors duration-500" style={{ color: resolved ? '#59b7c8' : '#8797a5' }}>
                    {resolved ? 'TRACKED · ASSIGNED · CURRENT' : d.meta}
                  </p>
                </div>
              )
            })}
            <div className="sm:hidden absolute inset-0 grid grid-cols-1 gap-2 content-center px-2">
              {floatingDocs.slice(0, 4).map((d, i) => (
                <div key={i} className="rounded-md px-4 py-3 border border-white/14 bg-white/[0.06]">
                  <p className="text-[12.5px] font-semibold text-mist truncate">{d.title}</p>
                  <p className="text-[10.5px] font-mono mt-0.5 text-steel">{d.meta}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
