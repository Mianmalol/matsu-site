import { useEffect, useRef, useState } from 'react'
import { Reveal } from '@/components/ui'
import { vessels, type Vessel } from '@/data'
import { MAP_W, MAP_H, LAND_PATH, PORTS, VESSEL_GEO, GRATICULE, CHOKEPOINTS } from '@/components/mapGeo'

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
  return s === 'compliant' ? { text: '#0d5c91', bg: '#dcecf2', bar: '#167db7', label: 'Complete' }
    : s === 'attention' ? { text: '#506170', bg: '#eef1f4', bar: '#8797a5', label: 'In Progress' }
    : { text: '#8a6410', bg: '#f7ecd2', bar: '#d9a441', label: 'Needs Review' }
}

const flagNames: Record<string, string> = { MT: 'Malta', PA: 'Panama', NO: 'Norway', LR: 'Liberia', BS: 'Bahamas' }

// pipeline stages a vessel has cleared in the demo, derived from its score
function stagesDone(x: Vessel) {
  return x.score >= 95 ? 6 : x.score >= 85 ? 5 : x.score >= 75 ? 4 : 3
}

const PIPELINE = ['Scanning', 'Extraction', 'Assignment', 'Actions', 'Evidence', 'Approval']

const agentEvents = [
  { t: '14:29', vessel: 'Coral Meridian', stage: 'Evidence', e: 'Bunker delivery notes received, routing to DPA' },
  { t: '14:25', vessel: 'Nordic Resolve', stage: 'Actions', e: 'PSC deficiency follow-up escalated as critical' },
  { t: '14:22', vessel: 'Pacific Endeavour', stage: 'Evidence', e: 'Fuel sample flagged: sulphur 0.52% vs 0.49% declared' },
  { t: '14:18', vessel: 'Strait Albatross', stage: 'Approval', e: 'DPA approved annual audit cycle, zero deficiencies' },
]

const actionsPerHour = [24, 32, 41, 36, 52, 58, 66]

// Small top-down vessel glyph, drawn pointing east (+x); rotated per heading.
function ShipMarker({ color, active }: { color: string; active: boolean }) {
  const s = active ? 1.25 : 1
  return (
    <g transform={`scale(${s})`}>
      <path d="M-12 -4 L6 -4 L13 0 L6 4 L-12 4 Z" fill={color} stroke="#05101a" strokeWidth="0.8" />
      <rect x="-9" y="-2.2" width="9" height="4.4" fill="#05101a" opacity="0.35" />
      <rect x="2" y="-1.6" width="3.4" height="3.2" fill="#f3f6f7" opacity="0.9" />
    </g>
  )
}

function FleetMap({ sel, onSelect }: { sel: string; onSelect: (id: string) => void }) {
  // Rotterdam & Antwerp sit ~8px apart on this chart; anchor their labels apart.
  const portLabel = (name: string): { dx: number; dy: number; anchor: 'start' | 'middle' | 'end' } =>
    name === 'ROTTERDAM' ? { dx: 8, dy: -4, anchor: 'start' }
    : name === 'ANTWERP' ? { dx: 8, dy: 10, anchor: 'start' }
    : name === 'HAMBURG' ? { dx: 8, dy: -6, anchor: 'start' }
    : name === 'SINGAPORE' ? { dx: 0, dy: -10, anchor: 'middle' }
    : { dx: 0, dy: -10, anchor: 'middle' }
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="w-full block" role="img" aria-label="Demonstration fleet chart: Mercator map from northwest Europe to Singapore with vessel positions and routes; selection follows the fleet table">
        <defs>
          <radialGradient id="seaDepth" cx="0.5" cy="0.42" r="0.9">
            <stop offset="0" stopColor="#155a8a" />
            <stop offset="1" stopColor="#0d3d5f" />
          </radialGradient>
        </defs>
        <rect width={MAP_W} height={MAP_H} fill="url(#seaDepth)" />
        <g stroke="#dcecf2" opacity="0.06">
          {GRATICULE.v.map(g => <line key={`v${g.x}`} x1={g.x} y1="0" x2={g.x} y2={MAP_H} strokeWidth="1" />)}
          {GRATICULE.h.map(g => <line key={`h${g.y}`} x1="0" y1={g.y} x2={MAP_W} y2={g.y} strokeWidth="1" />)}
        </g>
        <g fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fill="#8797a5" opacity="0.55">
          {GRATICULE.v.map(g => <text key={`vl${g.x}`} x={g.x + 4} y={MAP_H - 8}>{g.label}</text>)}
          {GRATICULE.h.map(g => <text key={`hl${g.y}`} x={MAP_W - 8} y={g.y - 4} textAnchor="end">{g.label}</text>)}
        </g>
        <path d={LAND_PATH} fill="#071a2c" opacity="0.95" stroke="#59b7c8" strokeWidth="0.7" strokeOpacity="0.4" />
        <g fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fill="#59b7c8" opacity="0.5">
          {CHOKEPOINTS.map(c => (
            <g key={c.name}>
              <circle cx={c.x} cy={c.y} r="1.6" fill="#59b7c8" />
              <text x={c.x + 6} y={c.y + 3}>{c.name}</text>
            </g>
          ))}
        </g>
        <g>
          {PORTS.map(p => {
            const l = portLabel(p.name)
            return (
              <g key={p.name}>
                <rect x={p.x - 3} y={p.y - 3} width="6" height="6" fill="#dcecf2" opacity="0.9" transform={`rotate(45 ${p.x} ${p.y})`} />
                <text x={p.x + l.dx} y={p.y + l.dy} textAnchor={l.anchor} fontFamily="'JetBrains Mono', monospace" fontSize="9.5" fill="#dcecf2" opacity="0.75">
                  {p.name}
                </text>
              </g>
            )
          })}
        </g>
        {vessels.map(v => {
          const active = v.id === sel
          const geo = VESSEL_GEO[v.id]
          const color = v.status === 'compliant' ? '#59b7c8' : '#d9a441'
          return (
            <g key={v.id} onClick={() => onSelect(v.id)} className="cursor-pointer">
              <path
                d={geo.d}
                fill="none"
                strokeWidth={active ? 2 : 1.3}
                strokeDasharray="4 8"
                className="anim-route"
                stroke={active ? '#9fdcea' : '#bcd9e6'}
                style={{ opacity: active ? 0.95 : 0.4, transition: 'opacity 0.4s ease' }}
              />
              <circle cx={geo.x} cy={geo.y} r="16" fill="transparent" />
              <circle className="anim-pulse-dot" cx={geo.x} cy={geo.y} r={active ? 17 : 13} fill={color} opacity={active ? 0.22 : 0.1} style={{ transition: 'opacity 0.4s ease', animationDelay: `${Number(v.id) * 0.5}s` }} />
              <g transform={`translate(${geo.x} ${geo.y}) rotate(${geo.heading})`}>
                <ShipMarker color={color} active={active} />
              </g>
              <text
                x={geo.x}
                y={geo.y - 20}
                textAnchor="middle"
                fontFamily="'JetBrains Mono', monospace"
                fontSize="10"
                fill={active ? '#dcecf2' : '#8797a5'}
                style={{ opacity: active ? 1 : 0, transition: 'opacity 0.4s ease' }}
              >
                {v.name.replace('MV ', '').toUpperCase()}{v.status === 'risk' ? ' · PSC RISK' : ''} → {v.port.toUpperCase()}
              </text>
            </g>
          )
        })}
        <text x="24" y={MAP_H - 16} fontFamily="'JetBrains Mono', monospace" fontSize="10" fill="#8797a5" opacity="0.8">
          SAMPLE DATA · DEMONSTRATION FLEET · MERCATOR
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
  // All figures below derive from the shared demonstration-fleet data.
  const compliant = vessels.filter(x => x.status === 'compliant').length
  const kpis: { label: string; value: string; amber?: boolean }[] = [
    { label: 'Vessels compliant', value: `${compliant} / ${vessels.length}` },
    { label: 'Regulations indexed', value: '2,847' },
    { label: 'Actions in flight', value: String(vessels.reduce((a, b) => a + b.actions, 0)) },
    { label: 'Needs review', value: String(vessels.filter(x => x.status !== 'compliant').length), amber: true },
  ]
  const pipelineDone = PIPELINE.map((_, i) => vessels.filter(x => stagesDone(x) >= i + 1).length)
  const stats: { label: string; value: string }[] = [
    { label: 'Vessels tracked', value: String(vessels.length) },
    { label: 'Certificates expiring ≤ 30 days', value: String(vessels.reduce((a, b) => a + b.expiring, 0)) },
    { label: 'Flag states', value: String(new Set(vessels.map(x => x.flag)).size) },
    { label: 'Ports monitored', value: String(new Set(vessels.map(x => x.port)).size) },
  ]

  return (
    <section id="platform" className="bg-fog py-28 lg:py-36 px-6">
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <h2 className="font-bold text-navy text-4xl md:text-6xl tracking-[-0.02em] leading-[1.03]">
            Total compliance visibility.
          </h2>
          <p className="mt-6 text-lg text-navy/60 max-w-xl leading-relaxed">
            Connect shore teams, vessel crews, operational records, and regulatory requirements through a single source of truth.
          </p>
        </Reveal>
        <Reveal delay={150} className="mt-16">
          <Blueprint />
        </Reveal>
        <Reveal delay={100} className="mt-4">
          <div className="bg-white border border-mist rounded-xl overflow-hidden shadow-[0_30px_80px_-40px_rgba(7,26,44,0.35)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-fog bg-fog/60 flex-wrap gap-2">
              <span className="text-sm font-semibold text-navy">Fleet Overview · Demonstration Fleet</span>
              <span className="flex items-center gap-5">
                <span className="flex items-center gap-2 text-xs font-medium text-navy/70">
                  <span className="w-2 h-2 rounded-full bg-ocean anim-pulse-dot" aria-hidden="true" />
                  Agent running
                </span>
                <span className="text-xs font-mono text-steel">SAMPLE DATA</span>
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-fog">
              {kpis.map((k, i) => (
                <div key={k.label} className={`px-6 py-5 ${i > 0 ? 'border-l border-fog' : ''}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-steel">{k.label}</p>
                  <p className="mt-1.5 text-2xl font-bold tracking-[-0.01em]" style={{ color: k.amber ? '#8a6410' : '#071a2c' }}>{k.value}</p>
                </div>
              ))}
            </div>
            <div className="grid lg:grid-cols-[1.6fr_1fr]">
              <div className="lg:border-r border-fog">
                <p className="px-6 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-steel">Demonstration fleet · {vessels.length} vessels</p>
                <div className="overflow-x-auto">
                  <div className="min-w-[620px]">
                    <div className="grid grid-cols-[1.8fr_0.9fr_1fr_1.1fr_1.1fr] gap-3 px-6 py-2.5 border-b border-fog">
                      {['Vessel', 'Flag', 'Type', 'Stages', 'Status'].map(h => (
                        <span key={h} className="text-[10px] font-semibold uppercase tracking-[0.16em] text-steel">{h}</span>
                      ))}
                    </div>
                    {vessels.map(x => {
                      const t = statusTint(x.status)
                      const done = stagesDone(x)
                      return (
                        <button key={x.id} onClick={() => setSel(x.id)}
                          className={`w-full grid grid-cols-[1.8fr_0.9fr_1fr_1.1fr_1.1fr] gap-3 px-6 py-4 text-left border-b border-fog transition-colors hover:bg-fog/70 ${sel === x.id ? 'bg-mist/40' : ''}`}
                          style={{ boxShadow: sel === x.id ? 'inset 3px 0 0 #167db7' : undefined }}>
                          <span>
                            <span className="block text-sm font-semibold text-navy">{x.name}</span>
                            <span className="block text-[11px] font-mono text-steel mt-0.5">IMO {x.imo}</span>
                          </span>
                          <span className="self-center text-[13px] text-navy/70">{flagNames[x.flag]}</span>
                          <span className="self-center text-[13px] text-navy/70">{x.type}</span>
                          <span className="self-center flex gap-1" aria-label={`${done} of ${PIPELINE.length} stages complete`}>
                            {PIPELINE.map((_, i) => (
                              <span key={i} className="h-[4px] flex-1 max-w-[16px] rounded-full" style={{ background: i < done ? (x.status === 'risk' && i === done - 1 ? '#d9a441' : '#167db7') : '#e5ecf0' }} />
                            ))}
                          </span>
                          <span className="self-center justify-self-start text-[11px] font-semibold px-2 py-1 rounded" style={{ color: t.text, background: t.bg }}>{t.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <p className="px-6 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-steel">Agent event log</p>
                <div className="pb-4">
                  {agentEvents.map(ev => (
                    <div key={ev.t} className="flex items-baseline gap-3 px-6 py-2 text-[12.5px]">
                      <span className="font-mono text-steel shrink-0">{ev.t}</span>
                      <span className="font-semibold text-navy shrink-0">{ev.vessel}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ocean shrink-0">{ev.stage}</span>
                      <span className="text-navy/70 truncate">{ev.e}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 space-y-7">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-steel mb-3">Actions processed / hr</p>
                  <svg viewBox="0 0 280 84" className="w-full" role="img" aria-label="Actions processed per hour, rising from 24 to 66 across the afternoon">
                    <g stroke="#f3f6f7" strokeWidth="1">
                      <line x1="24" y1="10" x2="272" y2="10" /><line x1="24" y1="66" x2="272" y2="66" />
                    </g>
                    <g fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fill="#8797a5">
                      <text x="18" y="70" textAnchor="end">20</text>
                      <text x="18" y="14" textAnchor="end">70</text>
                      {actionsPerHour.map((_, i) => <text key={i} x={30 + i * 40} y="82" textAnchor="middle">{String(8 + i).padStart(2, '0')}</text>)}
                    </g>
                    <polyline
                      points={actionsPerHour.map((a, i) => `${30 + i * 40},${66 - ((a - 20) / 50) * 56}`).join(' ')}
                      fill="none" stroke="#167db7" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-steel mb-3">Fleet compliance status</p>
                  <div className="space-y-3.5">
                    {(['compliant', 'attention', 'risk'] as const).map(s => {
                      const t = statusTint(s)
                      const n = vessels.filter(x => x.status === s).length
                      return (
                        <div key={s}>
                          <div className="flex items-center justify-between text-[13px] mb-1.5">
                            <span className="text-navy/70">{t.label}</span>
                            <span className="font-semibold text-navy">{n}</span>
                          </div>
                          <div className="h-[5px] rounded-full bg-fog">
                            <div className="h-full rounded-full" style={{ width: `${(n / vessels.length) * 100}%`, background: t.bar }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-steel mb-3">Pipeline stage breakdown</p>
                  <div className="space-y-3">
                    {PIPELINE.map((stage, i) => (
                      <div key={stage} className="flex items-center gap-3 text-[13px]">
                        <span className="w-4 text-[11px] font-mono text-steel">{i + 1}</span>
                        <span className="text-navy/70 w-24">{stage}</span>
                        <div className="flex-1 h-[5px] rounded-full bg-fog">
                          <div className="h-full rounded-full bg-ocean" style={{ width: `${(pipelineDone[i] / vessels.length) * 100}%` }} />
                        </div>
                        <span className="font-mono text-[11px] text-steel w-8 text-right">{pipelineDone[i]}/{vessels.length}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <FleetMap sel={sel} onSelect={setSel} />
            <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-white/10 bg-navy">
              {stats.map((s, i) => (
                <div key={s.label} className={`px-6 py-6 ${i > 0 ? 'border-l border-white/10' : ''}`}>
                  <p className="text-3xl font-bold text-white">{s.value}</p>
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
