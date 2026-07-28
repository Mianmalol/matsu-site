import { useScrollY, useReducedMotion, clamp01 } from '@/lib/hooks'
import { HeroScene } from '@/components/scenes'

// ═══════════════════════════════════════════════════════════════════════════
//  1 · Cinematic hero
// ═══════════════════════════════════════════════════════════════════════════

export default function Hero() {
  const y = useScrollY()
  const reduced = useReducedMotion()
  const fade = reduced ? 1 : 1 - clamp01(y / 340)
  const lift = reduced ? 0 : clamp01(y / 340) * 40
  return (
    <header id="top" className="relative h-dvh min-h-[680px] overflow-hidden">
      <HeroScene y={y} reduced={reduced} />
      <div
        className="relative h-full max-w-[1280px] mx-auto px-6 flex flex-col justify-center pt-24 md:pt-28 pb-16"
        style={{ opacity: fade, transform: `translateY(-${lift}px)`, pointerEvents: fade < 0.1 ? 'none' : undefined }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-maritime mb-6">AI Agents for Maritime Compliance</p>
        <h1 className="font-bold text-navy text-[40px] md:text-[64px] lg:text-[80px] leading-[0.98] tracking-[-0.03em] max-w-4xl">
          Navigate compliance.<br />Sail with confidence.
        </h1>
        <p className="mt-7 text-lg md:text-xl text-navy/70 max-w-xl leading-relaxed">
          One intelligent platform for vessel compliance, documentation, inspections, regulatory readiness, and fleet-wide risk management.
        </p>
        <div className="mt-9 flex items-center gap-4 flex-wrap">
          <a href="#platform" className="bg-navy text-white text-[15px] font-semibold px-7 py-4 rounded-md hover:bg-deepsea transition-colors">
            Explore the platform
          </a>
          <a href="#cta" className="text-[15px] font-medium text-navy bg-white/85 backdrop-blur-sm border border-navy/15 px-7 py-4 rounded-md hover:bg-white transition-colors">
            Request a demonstration →
          </a>
        </div>
      </div>
      <div
        className="absolute bottom-7 left-1/2 -translate-x-1/2 flex-col items-center gap-2 hidden md:flex"
        style={{ opacity: fade, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/80 font-medium">Descend</span>
        <span className="w-px h-9 bg-white/60" />
      </div>
    </header>
  )
}
