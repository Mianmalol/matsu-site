import { useEffect, useRef, useState } from 'react'
import { Reveal, Label } from '@/components/ui'
import { vessels, type Vessel } from '@/data'

// ═══════════════════════════════════════════════════════════════════════════
//  5 · Command deck (blueprint → fleet table ↔ live map)
// ═══════════════════════════════════════════════════════════════════════════

function Blueprint() {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setInView(true)), { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={`draw-when-in ${inView ? 'in' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 960 300" className="w-full">
        <defs>
          <marker id="dimArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10" fill="none" stroke="#8797a5" strokeWidth="1.4" />
          </marker>
        </defs>

        <g stroke="#8797a5" strokeWidth="1" strokeDasharray="3 6" opacity="0.22">
          {[240, 330, 420, 510, 600, 690, 780].map(x => (
            <line key={x} x1={x} y1="150" x2={x} y2="232" />
          ))}
        </g>

        <g fill="none" stroke="#167db7" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round">
          <path className="blueprint" style={{ ['--path-len' as string]: 2600 }}
            d="M100 141 C300 137 560 136 776 134 L826 125 L872 214 C892 219 901 228 888 234 L138 235 C113 235 92 207 88 177 L100 141"
          />
          <path className="blueprint" style={{ ['--path-len' as string]: 1100 }}
            d="M154 139 L154 82 L238 82 L238 139 M146 82 L246 82 L246 66 L146 66 L146 82 M156 73 L236 73 M194 66 L194 44 M186 44 L202 44 M256 139 L261 90 L288 93 L292 139 M258 96 L290 99"
          />
          <path className="blueprint" style={{ ['--path-len' as string]: 1400 }}
            d="M318 133 L318 118 L392 118 L392 133 M410 133 L410 118 L484 118 L484 133 M502 133 L502 118 L576 118 L576 133 M594 133 L594 118 L668 118 L668 133 M686 133 L686 118 L760 118 L760 133 M401 133 L401 80 L436 100 M585 133 L585 80 L620 100 M792 130 L792 103 M786 103 L798 103"
          />
          <path className="blueprint" style={{ ['--path-len' as string]: 700, opacity: 0.75 }} strokeWidth="1.3"
            d="M96 218 L96 236 L110 236 L110 220 M114 226 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M846 206 L858 206 M846 196 L858 196 M846 186 L858 186"
          />
        </g>

        <g stroke="#8797a5" opacity="0.55">
          <line x1="30" y1="214" x2="930" y2="214" strokeWidth="1.4" />
          <line x1="70" y1="246" x2="420" y2="246" strokeWidth="1" opacity="0.5" />
          <line x1="520" y1="252" x2="880" y2="252" strokeWidth="1" opacity="0.4" />
        </g>

        <g stroke="#8797a5" strokeWidth="1">
          <line x1="88" y1="274" x2="888" y2="274" markerStart="url(#dimArrow)" markerEnd="url(#dimArrow)" />
          <line x1="88" y1="240" x2="88" y2="280" opacity="0.4" />
          <line x1="888" y1="240" x2="888" y2="280" opacity="0.4" />
        </g>

        <g fontFamily="'JetBrains Mono', monospace" fontSize="10.5" fill="#8797a5">
          <text x="452" y="292" textAnchor="middle">LOA 229.0 M</text>
          <text x="866" y="180" textAnchor="start">DRAFT</text>
          <text x="480" y="34" textAnchor="middle" fontSize="11.5" fill="#0d5c91" letterSpacing="2">MV ADRIATIC PIONEER · BULK CARRIER · IMO 9876543</text>
          <text x="930" y="292" textAnchor="end">DWT 82,000</text>
        </g>
      </svg>
    </div>
  )
}

function statusTint(s: Vessel['status']) {
  return s === 'compliant' ? { text: '#0d5c91', bg: '#dcecf2', label: 'Compliant' }
    : s === 'attention' ? { text: '#8a6410', bg: '#f7ecd2', label: 'Attention' }
    : { text: '#9a3d12', bg: '#f6ddd0', label: 'At risk' }
}

function FleetMap({ sel, onSelect }: { sel: string; onSelect: (id: string) => void }) {
  return (
    <div className="relative">
      <svg viewBox="0 0 1180 420" className="w-full block" role="img" aria-label="Demonstration fleet map — vessel positions and routes; selection follows the fleet table">
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
        {vessels.map(v => {
          const active = v.id === sel
          const dotColor = v.status === 'compliant' ? '#59b7c8' : '#d9a441'
          return (
            <g key={v.id} onClick={() => onSelect(v.id)} className="cursor-pointer">
              <path
                d={v.map.route}
                fill="none"
                strokeWidth={active ? 2 : 1.4}
                strokeDasharray="4 8"
                className="anim-route"
                stroke={active ? '#59b7c8' : '#167db7'}
                style={{ opacity: active ? 0.95 : 0.3, transition: 'opacity 0.4s ease' }}
              />
              <g className="anim-pulse-dot" style={{ animationDelay: `${Number(v.id) * 0.5}s` }}>
                <circle cx={v.map.x} cy={v.map.y} r={active ? 13 : 10} fill={dotColor} opacity={active ? 0.3 : 0.16} style={{ transition: 'opacity 0.4s ease' }} />
                <circle cx={v.map.x} cy={v.map.y} r={active ? 5 : 4} fill={dotColor} />
              </g>
              <text
                x={v.map.x}
                y={v.map.y - 18}
                textAnchor="middle"
                fontFamily="'JetBrains Mono', monospace"
                fontSize="10"
                fill={active ? '#dcecf2' : '#8797a5'}
                style={{ opacity: active ? 1 : 0, transition: 'opacity 0.4s ease' }}
              >
                {v.name.replace('MV ', '').toUpperCase()}{v.status === 'risk' ? ' · PSC RISK' : ''}
              </text>
            </g>
          )
        })}
        <text x="24" y="404" fontFamily="'JetBrains Mono', monospace" fontSize="10" fill="#8797a5" opacity="0.8">
          SAMPLE DATA · DEMONSTRATION FLEET
        </text>
      </svg>
      <div
        className="absolute top-4 right-4 w-24 h-24 rounded-full pointer-events-none anim-radar"
        aria-hidden="true"
        style={{
          background: 'conic-gradient(rgba(89,183,200,0.28), rgba(89,183,200,0) 70deg)',
          border: '1px solid rgba(89,183,200,0.18)',
        }}
      />
    </div>
  )
}

export default function CommandDeck() {
  const [sel, setSel] = useState<string>('3')
  const v = vessels.find(x => x.id === sel)!
  const fleetRate = Math.round(vessels.reduce((a, b) => a + b.score, 0) / vessels.length)
  const circ = 2 * Math.PI * 54
  // All figures below derive from the shared demonstration-fleet data.
  const stats: { label: string; value: string; amber?: boolean }[] = [
    { label: 'Vessels tracked', value: String(vessels.length) },
    { label: 'Certificates expiring ≤ 30 days', value: String(vessels.reduce((a, b) => a + b.expiring, 0)) },
    { label: 'Open follow-up actions', value: String(vessels.reduce((a, b) => a + b.actions, 0)), amber: true },
    { label: 'Vessels needing attention', value: String(vessels.filter(x => x.status !== 'compliant').length) },
  ]

  return (
    <section id="platform" className="bg-fog py-28 lg:py-36 px-6">
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <Label>The command deck</Label>
          <h2 className="font-bold text-navy text-4xl md:text-6xl tracking-[-0.02em] max-w-2xl leading-[1.03]">
            One command deck. Total compliance visibility.
          </h2>
          <p className="mt-6 text-lg text-navy/60 max-w-xl leading-relaxed">
            Connect shore teams, vessel crews, operational records, and regulatory requirements through a single source of truth — and see risk before it becomes disruption.
          </p>
        </Reveal>
        <Reveal delay={150} className="mt-16">
          <Blueprint />
        </Reveal>
        <Reveal delay={100} className="mt-4">
          <div className="bg-white border border-mist rounded-xl overflow-hidden shadow-[0_30px_80px_-40px_rgba(7,26,44,0.35)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-fog bg-fog/60">
              <span className="text-sm font-semibold text-navy">Fleet compliance overview</span>
              <span className="text-xs font-mono text-steel">SAMPLE DATA · DEMONSTRATION FLEET</span>
            </div>
            <div className="grid lg:grid-cols-[1.5fr_1fr]">
              <div className="border-r border-fog">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-6 py-2.5 border-b border-fog">
                  {['Vessel', 'Score', 'Expiring', 'Actions'].map(h => (
                    <span key={h} className="text-[10px] font-semibold uppercase tracking-[0.16em] text-steel">{h}</span>
                  ))}
                </div>
                {vessels.map(x => {
                  const t = statusTint(x.status)
                  return (
                    <button key={x.id} onClick={() => setSel(x.id)}
                      className={`w-full grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-6 py-4 text-left border-b border-fog transition-colors hover:bg-fog/70 ${sel === x.id ? 'bg-mist/40' : ''}`}
                      style={{ boxShadow: sel === x.id ? 'inset 3px 0 0 #167db7' : undefined }}>
                      <span>
                        <span className="block text-sm font-semibold text-navy">{x.name}</span>
                        <span className="block text-[11px] font-mono text-steel mt-0.5">IMO {x.imo} · {x.type}</span>
                      </span>
                      <span className="self-center text-sm font-semibold" style={{ color: t.text }}>{x.score}</span>
                      <span className="self-center text-sm text-navy/70">{x.expiring}</span>
                      <span className="self-center text-sm text-navy/70">{x.actions}</span>
                    </button>
                  )
                })}
              </div>
              <div className="p-6">
                <div className="flex items-center gap-5 pb-5 border-b border-fog">
                  <svg width="128" height="128" viewBox="0 0 128 128" role="img" aria-label={`Fleet compliance rate ${fleetRate} percent`}>
                    <circle cx="64" cy="64" r="54" fill="none" stroke="#f3f6f7" strokeWidth="11" />
                    <circle cx="64" cy="64" r="54" fill="none" stroke="#167db7" strokeWidth="11" strokeLinecap="round"
                      strokeDasharray={`${(fleetRate / 100) * circ} ${circ}`} transform="rotate(-90 64 64)" />
                    <text x="64" y="60" textAnchor="middle" fontSize="26" fontWeight="700" fill="#071a2c" fontFamily="Inter, sans-serif">{fleetRate}%</text>
                    <text x="64" y="80" textAnchor="middle" fontSize="10" fill="#8797a5" fontFamily="Inter, sans-serif">fleet rate</text>
                  </svg>
                  <div className="space-y-2 text-[13px]">
                    {(['compliant', 'attention', 'risk'] as const).map(s => {
                      const t = statusTint(s)
                      const n = vessels.filter(x => x.status === s).length
                      return (
                        <div key={s} className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: t.text }} />
                          <span className="text-navy/70">{t.label}</span>
                          <span className="ml-auto font-semibold text-navy">{n}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="pt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-steel mb-3">Selected — {v.name}</p>
                  <div className="space-y-2.5 text-[13px]">
                    <div className="flex justify-between"><span className="text-navy/60">Status</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded" style={{ color: statusTint(v.status).text, background: statusTint(v.status).bg }}>{statusTint(v.status).label}</span></div>
                    <div className="flex justify-between"><span className="text-navy/60">Next port</span><span className="font-medium text-navy">{v.port}</span></div>
                    <div className="flex justify-between"><span className="text-navy/60">Certificates expiring ≤ 30 d</span><span className="font-medium text-navy">{v.expiring}</span></div>
                    <div className="flex justify-between"><span className="text-navy/60">Open corrective actions</span><span className="font-medium text-navy">{v.actions}</span></div>
                  </div>
                </div>
              </div>
            </div>
            <FleetMap sel={sel} onSelect={setSel} />
            <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-white/10 bg-navy">
              {stats.map((s, i) => (
                <div key={s.label} className={`px-6 py-6 ${i > 0 ? 'border-l border-white/10' : ''}`}>
                  <p className="text-3xl font-bold" style={{ color: s.amber ? '#d9a441' : '#ffffff' }}>{s.value}</p>
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
