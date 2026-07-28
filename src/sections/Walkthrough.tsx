import { useRef } from 'react'
import { useProgress } from '@/lib/hooks'
import { PhotoLayer } from '@/components/ui'
import { sceneArt } from '@/components/scenes'
import { scenes } from '@/data'

// ═══════════════════════════════════════════════════════════════════════════
//  4 · Interactive ship walkthrough
// ═══════════════════════════════════════════════════════════════════════════

export default function Walkthrough() {
  const ref = useRef<HTMLElement>(null)
  const p = useProgress(ref)
  const idx = Math.min(scenes.length - 1, Math.floor(p * scenes.length))

  return (
    <section id="solutions" ref={ref} className="relative bg-navy" style={{ height: `${scenes.length * 110}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col lg:flex-row">
        <div className="relative flex-1 bg-navy flex items-center order-2 lg:order-1">
          <div className="px-6 lg:px-14 xl:pl-[max(3.5rem,calc((100vw-1280px)/2+1.5rem))] py-10 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-seacyan mb-6">
              Aboard the vessel · {String(idx + 1).padStart(2, '0')} / {String(scenes.length).padStart(2, '0')} — {scenes[idx].kicker}
            </p>
            <h2 className="font-bold text-white text-3xl md:text-[44px] leading-[1.06] tracking-[-0.02em]">
              {scenes[idx].title}
            </h2>
            <p className="mt-6 text-mist/75 text-base md:text-lg leading-relaxed">
              {scenes[idx].copy}
            </p>
            <div className="mt-10 flex gap-2" aria-hidden="true">
              {scenes.map((s, i) => (
                <span key={s.key} className="h-[3px] rounded-full transition-all duration-500" style={{ width: idx === i ? 44 : 20, background: idx === i ? '#59b7c8' : 'rgba(220,236,242,0.25)' }} />
              ))}
            </div>
          </div>
        </div>
        <div className="relative h-[38vh] lg:h-auto lg:w-[54%] order-1 lg:order-2 bg-abyss">
          {scenes.map((s, i) => {
            const Art = sceneArt[s.key]
            return (
              <div key={s.key} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: idx === i ? 1 : 0 }} aria-hidden={idx !== i}>
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
