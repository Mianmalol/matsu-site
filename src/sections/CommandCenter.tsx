import { Reveal, Label } from '@/components/ui'
import { vessels } from '@/data'

// ═══════════════════════════════════════════════════════════════════════════
//  7 · Fleet command center
// ═══════════════════════════════════════════════════════════════════════════

export default function CommandCenter() {
  // All figures derived from the shared demonstration-fleet data above.
  const stats = [
    { label: 'Fleet compliance rate', value: `${Math.round(vessels.reduce((a, b) => a + b.score, 0) / vessels.length)}%` },
    { label: 'Certificates expiring ≤ 30 days', value: String(vessels.reduce((a, b) => a + b.expiring, 0)) },
    { label: 'Open follow-up actions', value: String(vessels.reduce((a, b) => a + b.actions, 0)) },
    { label: 'Vessels needing attention', value: String(vessels.filter(v => v.status !== 'compliant').length) },
  ]
  return (
    <section className="bg-navy py-28 lg:py-36 px-6 relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto relative">
        <Reveal>
          <Label tone="cyan">Fleet command center</Label>
          <h2 className="font-bold text-white text-4xl md:text-6xl tracking-[-0.02em] leading-[1.03] max-w-2xl">
            See risk before it becomes disruption.
          </h2>
          <p className="mt-6 text-lg text-mist/70 max-w-xl leading-relaxed">
            Prioritize the vessels, documents, inspections, and actions that require attention before they affect operations.
          </p>
        </Reveal>

        <Reveal delay={150} className="mt-14">
          <div className="rounded-xl border border-white/12 bg-deepsea/50 overflow-hidden">
            <svg viewBox="0 0 1180 420" className="w-full" role="img" aria-label="Fleet map with vessel positions and routes">
              <rect width="1180" height="420" fill="#071a2c" />
              <g stroke="#dcecf2" opacity="0.07">
                {Array.from({ length: 12 }).map((_, i) => <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="420" strokeWidth="1" />)}
                {Array.from({ length: 5 }).map((_, i) => <line key={`h${i}`} x1="0" y1={i * 100} x2="1180" y2={i * 100} strokeWidth="1" />)}
              </g>
              <g fill="#0d5c91" opacity="0.35">
                <path d="M80 90 q60 -40 150 -20 q70 16 60 70 q-8 46 -80 40 q-100 -8 -130 -90 Z" />
                <path d="M420 40 q120 -20 200 30 q60 40 20 90 q-50 60 -150 30 q-90 -28 -70 -150 Z" />
                <path d="M760 130 q100 -50 220 -10 q90 30 60 100 q-30 70 -160 50 q-130 -20 -120 -140 Z" />
                <path d="M240 280 q80 -10 120 40 q30 40 -10 70 q-60 40 -120 0 q-50 -36 10 -110 Z" />
              </g>
              <g fill="none" strokeWidth="1.6" strokeDasharray="4 8" className="anim-route">
                <path d="M180 160 Q 400 240, 620 180 T 1020 220" stroke="#59b7c8" opacity="0.7" />
                <path d="M300 330 Q 520 260, 760 300" stroke="#167db7" opacity="0.6" />
              </g>
              {[
                { x: 180, y: 160, ok: true }, { x: 620, y: 180, ok: true }, { x: 1020, y: 220, ok: false },
                { x: 300, y: 330, ok: true }, { x: 760, y: 300, ok: false },
              ].map((d, i) => (
                <g key={i} className="anim-pulse-dot" style={{ animationDelay: `${i * 0.5}s` }}>
                  <circle cx={d.x} cy={d.y} r="10" fill={d.ok ? '#59b7c8' : '#d9a441'} opacity="0.22" />
                  <circle cx={d.x} cy={d.y} r="4" fill={d.ok ? '#59b7c8' : '#d9a441'} />
                </g>
              ))}
              <g fontFamily="'JetBrains Mono', monospace" fontSize="10" fill="#8797a5">
                <text x="1020" y="252" textAnchor="middle">NORDIC RESOLVE · PSC RISK</text>
                <text x="180" y="140" textAnchor="middle">ADRIATIC PIONEER</text>
                <text x="24" y="404" opacity="0.8">SAMPLE DATA · DEMONSTRATION FLEET</text>
              </g>
            </svg>
            <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-white/10">
              {stats.map((s, i) => (
                <div key={s.label} className={`px-6 py-6 ${i > 0 ? 'border-l border-white/10' : ''}`}>
                  <p className="text-3xl font-bold" style={{ color: i === 2 ? '#d9a441' : '#ffffff' }}>{s.value}</p>
                  <p className="text-[12px] text-mist/60 mt-1.5 leading-snug">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
