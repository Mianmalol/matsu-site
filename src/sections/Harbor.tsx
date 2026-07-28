import { Reveal, PhotoLayer } from '@/components/ui'
import { CargoShip } from '@/components/scenes'
import { IMAGES } from '@/data'

// ═══════════════════════════════════════════════════════════════════════════
//  11 · Final harbor + CTA
// ═══════════════════════════════════════════════════════════════════════════

export default function Harbor() {
  return (
    <section id="cta" className="relative overflow-hidden">
      <div className="absolute inset-0" aria-hidden="true">
        <PhotoLayer src={IMAGES.harbor} wash="rgba(7,26,44,0.5)" />
        {!IMAGES.harbor && (
          <svg className="w-full h-full" viewBox="0 0 1440 760" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#0a2a43" />
                <stop offset="0.5" stopColor="#0d5c91" />
                <stop offset="0.72" stopColor="#59b7c8" />
                <stop offset="1" stopColor="#167db7" />
              </linearGradient>
            </defs>
            <rect width="1440" height="760" fill="url(#dawn)" />
            <rect y="530" width="1440" height="230" fill="#071a2c" />
            <rect y="500" width="1440" height="40" fill="#dcecf2" opacity="0.12" />
            <g stroke="#05101a" strokeWidth="6" opacity="0.85">
              {[1020, 1180, 1330].map((x, i) => (
                <g key={i}>
                  <line x1={x} y1="530" x2={x} y2="400" />
                  <line x1={x} y1="416" x2={x + 100} y2="416" />
                  <line x1={x - 18} y1="530" x2={x} y2="460" strokeWidth="3.5" />
                </g>
              ))}
            </g>
            {[1050, 1140, 1230, 1300, 1390].map((x, i) => (
              <circle key={i} cx={x} cy={i % 2 ? 508 : 496} r="3" fill="#d9a441" className="anim-pulse-dot" />
            ))}
            <g transform="translate(300 512)">
              <g className="anim-drift">
                <CargoShip scale={1.05} />
                <ellipse cx="110" cy="48" rx="150" ry="8" fill="#dcecf2" opacity="0.25" />
              </g>
            </g>
          </svg>
        )}
        <div className="absolute inset-0 bg-navy/55" />
      </div>
      <div className="relative max-w-[1280px] mx-auto px-6 py-40 lg:py-52 text-center">
        <Reveal>
          <h2 className="font-bold text-white text-5xl md:text-7xl tracking-[-0.03em] leading-[1.02]">
            Ready for every inspection.<br />Prepared for every voyage.
          </h2>
          <p className="mt-7 text-lg md:text-xl text-mist/85 max-w-xl mx-auto">
            Bring clarity, control, and confidence to maritime compliance.
          </p>
          <div className="mt-11 flex items-center justify-center gap-4 flex-wrap">
            <a href="mailto:marco0111ml@gmail.com?subject=Matsu%20demo%20request" className="bg-white text-navy text-[15px] font-semibold px-8 py-4 rounded-md hover:bg-mist transition-colors">
              Request a demonstration
            </a>
            <a href="#platform" className="text-[15px] font-medium text-white border border-white/40 px-8 py-4 rounded-md hover:border-white transition-colors">
              Explore the platform →
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
