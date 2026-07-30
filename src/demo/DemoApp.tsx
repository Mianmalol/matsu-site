// ═══════════════════════════════════════════════════════════════════════════
//  MATSU DEMO
//
//  Ported from the Figma Make export, restructured around the identity /
//  execution split described in src/data/scenario.ts.
//
//  Two kinds of row, and the difference is deliberate:
//
//    Real PIL hulls    → applicability. What the rulebook asks of a vessel with
//                        this flag and tonnage, plus a simulated pipeline
//                        position. No verdicts, no findings, no approvals.
//
//    Scenario vessels  → execution. The full interactive pipeline, including
//                        rejected evidence and DPA sign-off. Invented hulls, so
//                        invented records are fine.
//
//  Every surface showing simulated state carries its own marker, so a cropped
//  screenshot still says so.
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { FLEET_SOURCE, FLEET_COUNT, pilFleet, type FleetIdentity } from '@/data/pilFleet'
import {
  STAGES, REGULATIONS_INDEXED, OPERATOR_ROLE, SIMULATED_MARKER,
  applicabilityFor, applicabilitySummary, scenarioFleet, agentFeed,
  notifications, actionsPerHour,
  type Applicability, type ExecState, type ScenarioStage, type ScenarioVessel, type StageId,
} from '@/data/scenario'
import {
  BarChart2, Search, ArrowLeft, Bell, Settings, ChevronRight, Eye, CheckCircle2,
  ScanSearch, ListFilter, Anchor, ClipboardList, FolderOpen, UserCheck,
  FileText, Camera, Video, Stamp,
} from './icons'
import { AccountButton } from '@/auth/AuthGate'

const STAGE_ICON = [ScanSearch, ListFilter, Anchor, ClipboardList, FolderOpen, UserCheck]

/** Stable slug for a real hull. */
const slug = (name: string) => 'v-' + name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

// ═══════════════════════════════════════════════════════════════════════════
//  Shared bits
// ═══════════════════════════════════════════════════════════════════════════

const EXEC_CHIP: Record<ExecState, { cls: string; label: string }> = {
  complete: { cls: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: 'Complete' },
  active: { cls: 'bg-ocean/10 text-maritime border-ocean/25', label: 'In Progress' },
  'needs-review': { cls: 'bg-amber/10 text-[#8a6410] border-amber/35', label: 'Needs Review' },
  pending: { cls: 'bg-fog text-steel border-mist', label: 'Pending' },
}

function ExecChip({ state }: { state: ExecState }) {
  const s = EXEC_CHIP[state]
  return (
    <span className={`inline-flex items-center px-1.5 py-[2px] rounded text-[10px] font-medium border ${s.cls}`}>
      {s.label}
    </span>
  )
}

/**
 * The marker that has to travel with every piece of simulated state. Small, but
 * present on each card and row rather than once per page.
 */
function SimTag({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-steel ${className}`}
      title="Pipeline state shown here is simulated, not a record of actual compliance activity."
    >
      <span className="w-1 h-1 rounded-full bg-steel/60" />
      {SIMULATED_MARKER}
    </span>
  )
}

/** Neutral progress bar for a real hull: position only, no pass/fail colouring. */
function StageProgress({ reached }: { reached: StageId }) {
  return (
    <div className="flex items-center gap-px" aria-label={`Simulated stage ${reached} of 6`}>
      {STAGES.map(s => (
        <span
          key={s.id}
          className={`block w-5 h-[3px] ${s.id <= reached ? 'bg-ocean/70' : 'bg-mist'}`}
        />
      ))}
    </div>
  )
}

function ExecPips({ stages }: { stages: ScenarioStage[] }) {
  return (
    <div className="flex items-center gap-px">
      {stages.map(s => {
        const c = s.state === 'complete' ? 'bg-emerald-500'
          : s.state === 'active' ? 'bg-ocean'
          : s.state === 'needs-review' ? 'bg-amber'
          : 'bg-mist'
        return <span key={s.id} className={`block w-5 h-[3px] ${c}`} />
      })}
    </div>
  )
}

/**
 * Hand-rolled sparkline, following the marketing site's own chart approach:
 * axis labels live inside the SVG so they stay pinned to their data points,
 * and the viewBox scales as one unit instead of a fixed pixel height fighting
 * the aspect ratio.
 */
function Sparkline({ data }: { data: { h: string; v: number }[] }) {
  const W = 280, TOP = 10, BOT = 66
  const lo = 20, hi = 70
  const x = (i: number) => 30 + (i / (data.length - 1)) * (W - 38 - 30)
  const y = (v: number) => BOT - ((v - lo) / (hi - lo)) * (BOT - TOP)

  return (
    <svg viewBox={`0 0 ${W} 84`} className="w-full" role="img" aria-label="Actions processed per hour, rising across the afternoon">
      <g stroke="#f3f6f7" strokeWidth="1">
        <line x1="24" y1={TOP} x2={W - 8} y2={TOP} />
        <line x1="24" y1={BOT} x2={W - 8} y2={BOT} />
      </g>
      <g fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fill="#8797a5">
        <text x="18" y={BOT + 4} textAnchor="end">{lo}</text>
        <text x="18" y={TOP + 4} textAnchor="end">{hi}</text>
        {data.map((d, i) => (
          <text key={d.h} x={x(i)} y="82" textAnchor="middle">{d.h}</text>
        ))}
      </g>
      <polyline
        points={data.map((d, i) => `${x(i)},${y(d.v)}`).join(' ')}
        fill="none"
        stroke="#167db7"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1]!.v)} r="2.6" fill="#167db7" />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Sidebar
// ═══════════════════════════════════════════════════════════════════════════

function Sidebar({ active, onNav }: { active: string; onNav: (id: string) => void }) {
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()
  const fleet = q ? pilFleet.filter(v => v.name.toLowerCase().includes(q)) : pilFleet
  const scen = q ? scenarioFleet.filter(v => v.name.toLowerCase().includes(q)) : scenarioFleet

  return (
    <aside className="w-[220px] shrink-0 border-r border-mist bg-white flex flex-col h-full">
      <div className="px-2 pt-2 pb-1 shrink-0">
        <button
          onClick={() => onNav('dashboard')}
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-[12px] transition-colors ${
            active === 'dashboard' ? 'bg-ocean/10 text-maritime font-medium' : 'text-steel hover:text-navy hover:bg-fog'
          }`}
        >
          <BarChart2 size={13} /> Fleet Overview
        </button>
      </div>

      <div className="px-2 pb-1.5 shrink-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-mist">
          <Search size={11} className="text-steel shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter vessels…"
            aria-label="Filter vessels"
            className="flex-1 text-[11px] bg-transparent outline-none text-navy placeholder-steel"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        <div className="px-2 pt-1 pb-1 flex items-baseline justify-between">
          <span className="text-[10px] font-semibold text-steel uppercase tracking-widest">Fleet ({fleet.length})</span>
        </div>
        {fleet.map(v => {
          const id = slug(v.name)
          const on = active === id
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              className={`w-full flex items-center gap-2 px-3 py-[5px] rounded text-left transition-colors ${
                on ? 'bg-ocean/10 text-navy' : 'text-steel hover:text-navy hover:bg-fog'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-ocean/50" />
              <span className={`text-[12px] truncate flex-1 ${on ? 'font-medium' : ''}`}>{v.name}</span>
            </button>
          )
        })}

        {scen.length > 0 && (
          <>
            <div className="px-2 pt-3 pb-1">
              <span className="text-[10px] font-semibold text-steel uppercase tracking-widest">Scenario ({scen.length})</span>
              <p className="text-[9.5px] text-steel/80 leading-snug mt-1 normal-case tracking-normal">
                Invented vessels. Full pipeline records live here.
              </p>
            </div>
            {scen.map(v => {
              const on = active === v.id
              const dot = v.state === 'complete' ? 'bg-emerald-500' : v.state === 'active' ? 'bg-ocean' : 'bg-amber'
              return (
                <button
                  key={v.id}
                  onClick={() => onNav(v.id)}
                  className={`w-full flex items-center gap-2 px-3 py-[5px] rounded text-left transition-colors ${
                    on ? 'bg-ocean/10 text-navy' : 'text-steel hover:text-navy hover:bg-fog'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                  <span className={`text-[12px] truncate flex-1 ${on ? 'font-medium' : ''}`}>{v.name}</span>
                </button>
              )
            })}
          </>
        )}
      </nav>

      <div className="px-3 py-2.5 border-t border-mist shrink-0 flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-full bg-ocean flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
          DPA
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-medium text-navy truncate">{OPERATOR_ROLE}</div>
          <div className="text-[10px] text-steel">Demo account</div>
        </div>
        <AccountButton />
      </div>
    </aside>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Top bar
// ═══════════════════════════════════════════════════════════════════════════

function TopBar({ title, subtitle, onBack, showBack, onNav }: {
  title: string
  subtitle?: string
  onBack?: () => void
  showBack?: boolean
  onNav: (id: string) => void
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [dpaEmail, setDpaEmail] = useState(true)
  const [agentAlerts, setAgentAlerts] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(false)

  const q = query.trim().toLowerCase()
  const hits = q
    ? [
        ...pilFleet.filter(v => v.name.toLowerCase().includes(q)).map(v => ({ id: slug(v.name), name: v.name, meta: `${v.flag} · ${v.teu > 0 ? v.teu.toLocaleString() + ' TEU' : 'on order'}`, scenario: false })),
        ...scenarioFleet.filter(v => v.name.toLowerCase().includes(q)).map(v => ({ id: v.id, name: v.name, meta: `${v.type} · ${v.flag}`, scenario: true })),
      ].slice(0, 40)
    : []

  const toggles = [
    { label: 'DPA approval requests', sub: 'Alert when actions reach your queue', val: dpaEmail, set: setDpaEmail },
    { label: 'Agent alerts', sub: 'Evidence failures and blockers', val: agentAlerts, set: setAgentAlerts },
    { label: 'Weekly fleet report', sub: 'Every Monday 08:00 SGT', val: weeklyReport, set: setWeeklyReport },
  ]

  return (
    <>
      <header className="h-11 border-b border-mist bg-white flex items-center px-5 gap-3 shrink-0 relative z-20">
        {showBack && (
          <>
            <button onClick={onBack} className="flex items-center gap-1 text-[11px] text-steel hover:text-navy transition-colors">
              <ArrowLeft size={12} /> Back
            </button>
            <span className="text-mist">/</span>
          </>
        )}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-[13px] font-semibold text-navy truncate">{title}</span>
          {subtitle && <span className="text-[11px] text-steel truncate hidden md:block">{subtitle}</span>}
        </div>
        <div className="flex items-center gap-1.5 pr-3 border-r border-mist">
          <span className="relative flex h-[7px] w-[7px]">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ocean opacity-30" />
            <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-ocean" />
          </span>
          <span className="text-[10px] text-steel font-medium">Agent running</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => { setSearchOpen(true); setNotifOpen(false); setSettingsOpen(false) }}
            aria-label="Search vessels"
            className="w-7 h-7 flex items-center justify-center text-steel hover:text-navy hover:bg-fog rounded transition-colors"
          >
            <Search size={13} />
          </button>
          <button
            onClick={() => { setNotifOpen(o => !o); setSettingsOpen(false) }}
            aria-label="Notifications"
            className={`w-7 h-7 flex items-center justify-center rounded relative transition-colors ${notifOpen ? 'text-navy bg-fog' : 'text-steel hover:text-navy hover:bg-fog'}`}
          >
            <Bell size={13} />
            <span className="absolute top-1 right-1 w-[5px] h-[5px] bg-ocean rounded-full" />
          </button>
          <button
            onClick={() => { setSettingsOpen(o => !o); setNotifOpen(false) }}
            aria-label="Settings"
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${settingsOpen ? 'text-navy bg-fog' : 'text-steel hover:text-navy hover:bg-fog'}`}
          >
            <Settings size={13} />
          </button>
        </div>

        {notifOpen && (
          <div className="absolute top-11 right-0 w-[380px] bg-white border border-mist rounded-lg shadow-lg overflow-hidden z-30">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-mist">
              <span className="text-[12px] font-semibold text-navy">Notifications</span>
              <SimTag />
            </div>
            <div className="divide-y divide-mist max-h-80 overflow-y-auto">
              {notifications.map(n => {
                const dot = n.type === 'success' ? 'bg-emerald-500' : n.type === 'warning' ? 'bg-amber' : 'bg-ocean'
                return (
                  <div key={n.id} className="px-4 py-2.5 hover:bg-fog">
                    <div className="flex items-start gap-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-[5px] ${dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-[11px] font-medium text-maritime">{n.vessel}</span>
                          <span className="text-[10px] text-steel shrink-0">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-navy/80 leading-relaxed">{n.title}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {settingsOpen && (
          <div className="absolute top-11 right-0 w-72 bg-white border border-mist rounded-lg shadow-lg overflow-hidden z-30">
            <div className="px-4 py-2.5 border-b border-mist">
              <span className="text-[12px] font-semibold text-navy">Settings</span>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="text-[10px] font-semibold text-steel uppercase tracking-wider mb-2">Account</div>
                <div className="flex items-center gap-2.5 p-2.5 bg-fog rounded border border-mist">
                  <div className="w-7 h-7 rounded-full bg-ocean flex items-center justify-center text-white text-[10px] font-semibold">DPA</div>
                  <div>
                    <div className="text-[12px] font-medium text-navy">{OPERATOR_ROLE}</div>
                    <div className="text-[10px] text-steel">Demo account</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-steel uppercase tracking-wider mb-2">Notifications</div>
                <div className="space-y-2.5">
                  {toggles.map(({ label, sub, val, set }) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] text-navy">{label}</div>
                        <div className="text-[10px] text-steel">{sub}</div>
                      </div>
                      <button
                        onClick={() => set(v => !v)}
                        role="switch"
                        aria-checked={val}
                        aria-label={label}
                        className={`relative rounded-full shrink-0 transition-colors ${val ? 'bg-ocean' : 'bg-mist'}`}
                        style={{ width: 30, height: 17 }}
                      >
                        <span className={`absolute top-[2px] w-[13px] h-[13px] bg-white rounded-full shadow-sm transition-transform ${val ? 'translate-x-[15px]' : 'translate-x-[2px]'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-steel uppercase tracking-wider mb-2">Agent</div>
                <div className="space-y-1.5">
                  {[
                    ['Scan frequency', 'Every 6 hours'],
                    ['Regulations indexed', REGULATIONS_INDEXED.toLocaleString()],
                    ['Last sync', '14:29 SGT'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-[11px] text-steel">{k}</span>
                      <span className="text-[11px] font-medium text-navy">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20"
          onClick={() => { setSearchOpen(false); setQuery('') }}
        >
          <div className="absolute inset-0 bg-navy/25" />
          <div className="relative w-full max-w-[520px] bg-white rounded-lg shadow-xl border border-mist overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-mist">
              <Search size={13} className="text-steel shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') { setSearchOpen(false); setQuery('') } }}
                placeholder="Search vessels and flags…"
                aria-label="Search vessels"
                className="flex-1 text-[13px] text-navy placeholder-steel outline-none"
              />
              <button
                onClick={() => { setSearchOpen(false); setQuery('') }}
                className="text-[10px] text-steel border border-mist rounded px-1.5 py-0.5 hover:bg-fog"
              >
                Esc
              </button>
            </div>
            {q.length === 0 && (
              <div className="px-4 py-3">
                <div className="text-[10px] font-semibold text-steel uppercase tracking-wider mb-2">Scenario vessels</div>
                {scenarioFleet.map(v => (
                  <button
                    key={v.id}
                    onClick={() => { onNav(v.id); setSearchOpen(false); setQuery('') }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-fog transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-medium text-navy">{v.name}</span>
                      <span className="text-[11px] text-steel ml-2">{v.type} · {v.flag}</span>
                    </div>
                    <ExecChip state={v.state} />
                  </button>
                ))}
              </div>
            )}
            {hits.length > 0 && (
              <div className="max-h-72 overflow-y-auto divide-y divide-mist">
                {hits.map(h => (
                  <button
                    key={h.id}
                    onClick={() => { onNav(h.id); setSearchOpen(false); setQuery('') }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-fog transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-navy">{h.name}</div>
                      <div className="text-[10px] text-steel">{h.meta}</div>
                    </div>
                    {h.scenario && <span className="text-[9.5px] uppercase tracking-[0.14em] text-steel">Scenario</span>}
                  </button>
                ))}
              </div>
            )}
            {q.length > 0 && hits.length === 0 && (
              <div className="px-4 py-8 text-center text-[12px] text-steel">No vessels matching “{query}”</div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Dashboard
// ═══════════════════════════════════════════════════════════════════════════

function Dashboard({ onNav }: { onNav: (id: string) => void }) {
  const apps = pilFleet.map((v, i) => applicabilityFor(v, i))
  const obligations = apps.reduce((a, x) => a + x.requirements, 0)
  const projectedActions = apps.reduce((a, x) => a + x.actions, 0)
  const inFlight = scenarioFleet.filter(v => v.state === 'active').length
  const flagged = scenarioFleet.filter(v => v.state === 'needs-review').length

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {/* KPI strip. Fleet figures are real counts; scenario figures are simulated. */}
      <div className="flex items-stretch border-b border-mist divide-x divide-mist">
        {[
          { label: 'Vessels in fleet', value: String(FLEET_COUNT), accent: true, sim: false },
          { label: 'Regulations indexed', value: REGULATIONS_INDEXED.toLocaleString(), accent: false, sim: false },
          { label: 'Obligations mapped', value: obligations.toLocaleString(), accent: false, sim: false },
          { label: 'Scenario cycles in flight', value: String(inFlight + flagged), accent: false, sim: true },
        ].map(({ label, value, accent, sim }) => (
          <div key={label} className="flex flex-col justify-center px-6 py-3 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="text-[10px] text-steel font-medium uppercase tracking-wider">{label}</div>
              {sim && <SimTag />}
            </div>
            <div className={`text-[20px] font-bold tabular-nums leading-tight ${accent ? 'text-ocean' : 'text-navy'}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-5 space-y-5">
        {/* Provenance. States plainly what is real here and what is not. */}
        <div className="border border-mist rounded-lg bg-fog px-4 py-3">
          <p className="text-[11px] text-navy/80 leading-relaxed">
            <span className="font-semibold text-navy">Fleet data is real.</span>{' '}
            {FLEET_COUNT} vessel identities from the {FLEET_SOURCE.source} ({FLEET_SOURCE.operator}), retrieved {FLEET_SOURCE.retrieved}.
            Flags, build years and TEU capacities are as published.
          </p>
          <p className="text-[11px] text-steel leading-relaxed mt-1.5">
            Pipeline state against those hulls is simulated and shows which obligations apply, not what any operator has or has not done.
            Compliance records, findings and approvals belong to the invented scenario vessels.
          </p>
        </div>

        <div className="grid grid-cols-5 gap-5">
          {/* Real fleet: applicability only */}
          <div className="col-span-3">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-[11px] font-semibold text-steel uppercase tracking-wider">
                Fleet · obligations by vessel
              </h2>
              <SimTag />
            </div>
            <div className="border border-mist rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] border-collapse">
                  <thead>
                    <tr className="bg-fog border-b border-mist">
                      <th className="text-left px-4 py-2 text-[10px] font-semibold text-steel uppercase tracking-wider">Vessel</th>
                      <th className="text-left px-3 py-2 text-[10px] font-semibold text-steel uppercase tracking-wider">Flag</th>
                      <th className="text-right px-3 py-2 text-[10px] font-semibold text-steel uppercase tracking-wider">TEU</th>
                      <th className="text-right px-3 py-2 text-[10px] font-semibold text-steel uppercase tracking-wider">Obligations</th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-steel uppercase tracking-wider">Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-mist">
                    {pilFleet.slice(0, 14).map((v, i) => {
                      const a = applicabilityFor(v, i)
                      return (
                        <tr key={v.name} onClick={() => onNav(slug(v.name))} className="hover:bg-fog cursor-pointer transition-colors">
                          <td className="px-4 py-2.5 font-medium text-navy">{v.name}</td>
                          <td className="px-3 py-2.5 text-steel">{v.flag}</td>
                          <td className="px-3 py-2.5 text-right text-steel tabular-nums font-mono text-[11px]">
                            {v.teu > 0 ? v.teu.toLocaleString() : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-right text-navy tabular-nums font-mono text-[11px]">
                            {a.requirements > 0 ? a.requirements : '—'}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <StageProgress reached={a.stageReached} />
                              <span className="text-[10px] text-steel tabular-nums">{a.stageReached}/6</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 border-t border-mist bg-fog text-[11px] text-steel">
                Showing 14 of {FLEET_COUNT}. The full fleet is in the sidebar.
              </div>
            </div>
          </div>

          <div className="col-span-2 space-y-5">
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="text-[11px] font-semibold text-steel uppercase tracking-wider">Actions processed / hr</h2>
                <SimTag />
              </div>
              <div className="border border-mist rounded-lg p-4 bg-white">
                <Sparkline data={actionsPerHour} />
              </div>
            </div>

            <div>
              <h2 className="text-[11px] font-semibold text-steel uppercase tracking-wider mb-2">Projected workload</h2>
              <div className="border border-mist rounded-lg overflow-hidden">
                {[
                  ['Obligations mapped', obligations.toLocaleString()],
                  ['Actions these would generate', projectedActions.toLocaleString()],
                  ['Instruments indexed', REGULATIONS_INDEXED.toLocaleString()],
                ].map(([k, v], i, arr) => (
                  <div key={k} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? 'border-b border-mist' : ''}`}>
                    <span className="text-[11px] text-steel">{k}</span>
                    <span className="text-[12px] font-semibold text-navy tabular-nums">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="text-[11px] font-semibold text-steel uppercase tracking-wider">Pipeline stages</h2>
                <SimTag />
              </div>
              <div className="border border-mist rounded-lg overflow-hidden">
                {STAGES.map((stage, i) => {
                  const Icon = STAGE_ICON[i]!
                  const reached = apps.filter(a => a.stageReached >= stage.id).length
                  return (
                    <div key={stage.id} className={`flex items-center gap-3 px-4 py-2.5 ${i < STAGES.length - 1 ? 'border-b border-mist' : ''}`}>
                      <span className="text-[10px] font-mono text-mist w-4 shrink-0">{stage.id}</span>
                      <Icon size={11} className="text-steel shrink-0" />
                      <span className="text-[11px] text-steel flex-1">{stage.short}</span>
                      <div className="h-[3px] w-20 bg-fog rounded-full overflow-hidden shrink-0">
                        <div className="h-full bg-ocean/70 rounded-full" style={{ width: `${(reached / FLEET_COUNT) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-steel tabular-nums w-12 text-right shrink-0">{reached}/{FLEET_COUNT}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Scenario vessels: the only place execution state lives */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-[11px] font-semibold text-steel uppercase tracking-wider">Scenario vessels · full pipeline</h2>
            <span className="text-[10px] text-steel">Invented hulls, invented records</span>
          </div>
          <div className="border border-mist rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="bg-fog border-b border-mist">
                    <th className="text-left px-4 py-2 text-[10px] font-semibold text-steel uppercase tracking-wider">Vessel</th>
                    <th className="text-left px-3 py-2 text-[10px] font-semibold text-steel uppercase tracking-wider">Type</th>
                    <th className="text-left px-3 py-2 text-[10px] font-semibold text-steel uppercase tracking-wider">Flag</th>
                    <th className="px-3 py-2 text-[10px] font-semibold text-steel uppercase tracking-wider">Stages</th>
                    <th className="px-4 py-2 text-[10px] font-semibold text-steel uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist">
                  {scenarioFleet.map(v => (
                    <tr key={v.id} onClick={() => onNav(v.id)} className="hover:bg-fog cursor-pointer transition-colors">
                      <td className="px-4 py-2.5 font-medium text-navy">{v.name}</td>
                      <td className="px-3 py-2.5 text-steel">{v.type}</td>
                      <td className="px-3 py-2.5 text-steel">{v.flag}</td>
                      <td className="px-3 py-2.5"><ExecPips stages={v.stages} /></td>
                      <td className="px-4 py-2.5"><ExecChip state={v.state} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Agent event log */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-[11px] font-semibold text-steel uppercase tracking-wider">Agent event log</h2>
            <SimTag />
          </div>
          <div className="border border-mist rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-fog border-b border-mist">
                    <th className="text-left px-4 py-2 text-[10px] font-semibold text-steel uppercase tracking-wider w-16">Time</th>
                    <th className="text-left px-3 py-2 text-[10px] font-semibold text-steel uppercase tracking-wider w-40">Vessel</th>
                    <th className="text-left px-3 py-2 text-[10px] font-semibold text-steel uppercase tracking-wider w-24">Stage</th>
                    <th className="text-left px-4 py-2 text-[10px] font-semibold text-steel uppercase tracking-wider">Event</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist">
                  {agentFeed.map((e, i) => {
                    const dot = e.type === 'success' ? 'bg-emerald-500' : e.type === 'warning' ? 'bg-amber' : 'bg-ocean'
                    return (
                      <tr key={i} className="hover:bg-fog transition-colors">
                        <td className="px-4 py-2.5 font-mono text-steel">{e.time}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                            <span className="font-medium text-navy truncate">{e.vessel}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-steel">{e.stage}</td>
                        <td className="px-4 py-2.5 text-navy/80">{e.action}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Real vessel page — applicability only
// ═══════════════════════════════════════════════════════════════════════════

function FleetVesselPage({ vessel, app }: { vessel: FleetIdentity; app: Applicability }) {
  const [open, setOpen] = useState<StageId | null>(null)

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="border-b border-mist px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-start gap-6 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-semibold text-navy mb-1">{vessel.name}</h1>
            <div className="flex items-center gap-2 text-[11px] text-steel flex-wrap">
              <span>{app.classLabel}</span>
              <span>·</span>
              <span>Flag: <span className="text-navy/70">{vessel.flag}</span></span>
              <span>·</span>
              <span>Built: <span className="text-navy/70">{vessel.year ?? '—'}</span></span>
              <span>·</span>
              <span>Capacity: <span className="text-navy/70">{vessel.teu > 0 ? `${vessel.teu.toLocaleString()} TEU` : 'on order'}</span></span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="flex items-center justify-end gap-2 mb-2">
              <span className="text-[11px] text-steel">Pipeline position</span>
              <SimTag />
            </div>
            <StageProgress reached={app.stageReached} />
            <div className="text-[10px] text-steel mt-1">Stage {app.stageReached} of 6</div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-5">
        <div className="border border-mist rounded-lg bg-fog px-4 py-3 mb-5">
          <p className="text-[11px] text-navy/80 leading-relaxed">
            This vessel’s identity is real, taken from the {FLEET_SOURCE.source}. What follows is which obligations
            apply to a hull of this flag and tonnage, and what a Matsu run would generate against them.
          </p>
          <p className="text-[11px] text-steel leading-relaxed mt-1.5">
            It is not a record of what {FLEET_SOURCE.operator} has done. Nothing here says an action was completed,
            evidence was accepted, or a finding was raised. Those records live on the scenario vessels.
          </p>
        </div>

        <h2 className="text-[11px] font-semibold text-steel uppercase tracking-wider mb-3">Applicable obligations by stage</h2>
        <div className="border border-mist rounded-lg overflow-hidden divide-y divide-mist">
          {STAGES.map((stage, i) => {
            const Icon = STAGE_ICON[i]!
            const isOpen = open === stage.id
            const reached = app.stageReached >= stage.id
            const count = stage.id === 1 ? REGULATIONS_INDEXED
              : stage.id === 2 || stage.id === 3 ? app.requirements
              : stage.id === 4 ? app.actions
              : stage.id === 5 ? app.evidenceItems
              : app.actions
            const countLabel = stage.id === 1 ? 'instruments indexed'
              : stage.id === 2 ? 'obligations apply'
              : stage.id === 3 ? 'mapped to this hull'
              : stage.id === 4 ? 'actions would generate'
              : stage.id === 5 ? 'evidence artefacts'
              : 'would route to DPA'
            return (
              <div key={stage.id} className={`bg-white border-l-2 ${reached ? 'border-l-ocean/50' : 'border-l-transparent'}`}>
                <button
                  onClick={() => setOpen(isOpen ? null : stage.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-4 px-5 py-3 hover:bg-fog transition-colors text-left"
                >
                  <span className="text-[11px] font-mono text-mist w-4 shrink-0 text-right">{String(stage.id).padStart(2, '0')}</span>
                  <Icon size={13} className={`shrink-0 ${reached ? 'text-maritime' : 'text-steel'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-navy">{stage.label}</div>
                    <div className="text-[11px] text-steel truncate mt-0.5">{applicabilitySummary(stage.id, vessel, app)}</div>
                  </div>
                  <div className="text-right shrink-0 mr-3">
                    <div className="text-[13px] font-semibold text-navy tabular-nums">{count.toLocaleString()}</div>
                    <div className="text-[10px] text-steel">{countLabel}</div>
                  </div>
                  <ChevronRight size={13} className={`text-steel shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
                {isOpen && (
                  <div className="border-t border-mist px-5 py-4 bg-fog/60">
                    <FleetStageDetail stage={stage.id} vessel={vessel} app={app} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** Applicability detail. Rulebook facts and projections only. */
function FleetStageDetail({ stage, vessel, app }: { stage: StageId; vessel: FleetIdentity; app: Applicability }) {
  if (stage === 1) {
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-steel leading-relaxed">
          Instruments indexed for a hull on the {vessel.flag} register, kept current at the source.
        </p>
        <div className="border border-mist rounded-lg overflow-hidden bg-white">
          <table className="w-full text-[11px] border-collapse">
            <tbody className="divide-y divide-mist">
              {['SOLAS', 'MARPOL 73/78 Annex I–VI', 'ISM Code', 'STCW Convention', 'MLC 2006', 'ISPS Code Part A & B'].map(reg => (
                <tr key={reg} className="hover:bg-fog">
                  <td className="px-4 py-2 text-navy">
                    <div className="flex items-center gap-2"><CheckCircle2 size={11} className="text-ocean shrink-0" />{reg}</div>
                  </td>
                  <td className="px-4 py-2 text-steel font-mono text-right">Indexed</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (stage === 2) {
    const examples = [
      { id: 'REQ-0411', obligation: 'Fixed fire detection systems tested within 12 months', category: 'Safety' },
      { id: 'REQ-0412', obligation: 'SEEMP Part III with CII rating reviewed annually', category: 'Environmental' },
      { id: 'REQ-0410', obligation: 'All crew hold valid basic safety training certificates', category: 'Crew' },
      { id: 'REQ-0409', obligation: 'Emergency preparedness drills at required SOLAS frequency', category: 'Safety' },
      { id: 'REQ-0408', obligation: 'Seafarer Employment Agreements signed before embarkation', category: 'Labour' },
    ]
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-steel leading-relaxed">
          <strong className="text-navy font-medium">{app.requirements} obligations</strong> apply to this vessel profile,
          each traceable to its source paragraph. A sample:
        </p>
        <div className="border border-mist rounded-lg overflow-hidden bg-white">
          <table className="w-full text-[11px] border-collapse">
            <tbody className="divide-y divide-mist">
              {examples.map(r => (
                <tr key={r.id} className="hover:bg-fog">
                  <td className="px-4 py-2 font-mono text-steel">{r.id}</td>
                  <td className="px-4 py-2 text-navy">{r.obligation}</td>
                  <td className="px-4 py-2 text-steel">{r.category}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} className="px-4 py-2 text-steel">
                  +{Math.max(0, app.requirements - examples.length)} more applicable to this hull
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (stage === 3) {
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-steel leading-relaxed">
          Obligations are matched on the attributes below. Change the flag or the tonnage and the applicable set changes with it.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Vessel class', app.classLabel],
            ['Flag state', vessel.flag],
            ['Capacity', vessel.teu > 0 ? `${vessel.teu.toLocaleString()} TEU` : 'On order'],
            ['Obligations mapped', String(app.requirements)],
          ].map(([label, value]) => (
            <div key={label} className="border border-mist rounded p-3 bg-white">
              <div className="text-[10px] text-steel mb-1">{label}</div>
              <div className="text-[12px] font-semibold text-navy">{value}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (stage === 4) {
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-steel leading-relaxed">
          <strong className="text-navy font-medium">{app.actions} actions</strong> would be generated from those obligations,
          each linked to a requirement with a due date and an evidence type. Examples of the action shapes:
        </p>
        <div className="border border-mist rounded-lg overflow-hidden bg-white">
          <table className="w-full text-[11px] border-collapse">
            <tbody className="divide-y divide-mist">
              {[
                'Upload updated SEEMP Part III signed by the Master',
                'Collect signed Seafarer Employment Agreements for joining crew',
                'Conduct fire and abandon-ship drill, upload the report',
                'Update the Ship Security Plan for the current port rotation',
              ].map(a => (
                <tr key={a} className="hover:bg-fog">
                  <td className="px-4 py-2 text-navy">{a}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10.5px] text-steel leading-relaxed">
          Due dates and completion state are not shown for this hull. See a scenario vessel for a worked cycle.
        </p>
      </div>
    )
  }

  if (stage === 5) {
    const types = [
      { label: 'Drill and audit reports', type: 'PDF', icon: <FileText size={11} className="text-steel" /> },
      { label: 'Signed record-book pages', type: 'PDF', icon: <FileText size={11} className="text-steel" /> },
      { label: 'Sample analysis certificates', type: 'Photo', icon: <Camera size={11} className="text-steel" /> },
      { label: 'Drill footage where required', type: 'Video', icon: <Video size={11} className="text-steel" /> },
    ]
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-steel leading-relaxed">
          <strong className="text-navy font-medium">{app.evidenceItems} evidence artefacts</strong> would be requested
          against those actions, validated on format, completeness, and whether they satisfy the linked requirement.
        </p>
        <div className="border border-mist rounded-lg overflow-hidden bg-white">
          <table className="w-full text-[11px] border-collapse">
            <tbody className="divide-y divide-mist">
              {types.map(t => (
                <tr key={t.label} className="hover:bg-fog">
                  <td className="px-4 py-2 text-navy">{t.label}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5 text-steel">{t.icon}{t.type}</div>
                  </td>
                  <td className="pr-4 py-2 text-right"><Eye size={11} className="text-mist inline" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <p className="text-[11px] text-steel leading-relaxed">
      Completed actions route to the {OPERATOR_ROLE} for explicit sign-off before the record is finalised.
      No action is closed by the agent alone. Open a scenario vessel to work an approval queue.
    </p>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Scenario vessel page — full execution state
// ═══════════════════════════════════════════════════════════════════════════

function ScenarioVesselPage({ vessel }: { vessel: ScenarioVessel }) {
  const [open, setOpen] = useState<StageId | null>(null)
  const done = vessel.stages.filter(s => s.state === 'complete').length
  const currentIdx = vessel.stages.findIndex(s => s.state === 'active' || s.state === 'needs-review')

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="border-b border-mist px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-start gap-6 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-[15px] font-semibold text-navy">{vessel.name}</h1>
              <ExecChip state={vessel.state} />
              <span className="text-[9.5px] uppercase tracking-[0.14em] text-steel border border-mist rounded px-1.5 py-0.5">
                Scenario vessel
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-steel flex-wrap">
              <span>{vessel.type}</span>
              <span>·</span>
              <span>Flag: <span className="text-navy/70">{vessel.flag}</span></span>
              <span>·</span>
              <span>Built: <span className="text-navy/70">{vessel.year}</span></span>
              <span>·</span>
              <span>Route: <span className="text-navy/70">{vessel.route}</span></span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[11px] text-steel mb-2">Compliance stages</div>
            <div className="flex items-end gap-1">
              {vessel.stages.map(s => {
                const h = s.state === 'complete' ? 'h-5' : s.state === 'active' ? 'h-3.5' : s.state === 'needs-review' ? 'h-3' : 'h-2'
                const c = s.state === 'complete' ? 'bg-emerald-500' : s.state === 'active' ? 'bg-ocean' : s.state === 'needs-review' ? 'bg-amber' : 'bg-mist'
                return <div key={s.id} className={`w-5 ${h} ${c} rounded-sm`} />
              })}
            </div>
            <div className="text-[10px] text-steel mt-1">{done} of 6 complete</div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-5">
        <div className="border border-mist rounded-lg bg-fog px-4 py-3 mb-5">
          <p className="text-[11px] text-navy/80 leading-relaxed">
            An invented vessel. Every record below is fabricated for the demo, which is why the interactive pipeline
            lives here rather than on a real hull.
          </p>
        </div>

        <h2 className="text-[11px] font-semibold text-steel uppercase tracking-wider mb-3">Compliance pipeline</h2>
        <div className="border border-mist rounded-lg overflow-hidden divide-y divide-mist">
          {vessel.stages.map((stage, i) => {
            const Icon = STAGE_ICON[i]!
            const isOpen = open === stage.id
            const isCurrent = i === currentIdx
            const iconColor = stage.state === 'complete' ? 'text-emerald-600'
              : stage.state === 'active' ? 'text-maritime'
              : stage.state === 'needs-review' ? 'text-[#8a6410]'
              : 'text-steel'
            return (
              <div key={stage.id} className={`bg-white border-l-2 ${isCurrent ? 'border-l-ocean' : 'border-l-transparent'}`}>
                <button
                  onClick={() => setOpen(isOpen ? null : stage.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-4 px-5 py-3 hover:bg-fog transition-colors text-left"
                >
                  <span className="text-[11px] font-mono text-mist w-4 shrink-0 text-right">{String(stage.id).padStart(2, '0')}</span>
                  <Icon size={13} className={`shrink-0 ${iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-navy">{STAGES[i]!.label}</div>
                    <div className="text-[11px] text-steel truncate mt-0.5">{stage.summary}</div>
                  </div>
                  <div className="text-right shrink-0 mr-4">
                    <div className="text-[13px] font-semibold text-navy tabular-nums">{stage.count.toLocaleString()}</div>
                    <div className="text-[10px] text-steel">{stage.countLabel}</div>
                  </div>
                  <ExecChip state={stage.state} />
                  <ChevronRight size={13} className={`text-steel shrink-0 ml-1 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
                {isOpen && (
                  <div className="border-t border-mist px-5 py-4 bg-fog/60">
                    <ScenarioStageDetail stage={stage} vessel={vessel} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ScenarioStageDetail({ stage, vessel }: { stage: ScenarioStage; vessel: ScenarioVessel }) {
  const [approved, setApproved] = useState<string[]>([])

  const Table = ({ children }: { children: React.ReactNode }) => (
    <div className="border border-mist rounded-lg overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] border-collapse">{children}</table>
      </div>
    </div>
  )

  const Head = ({ cols }: { cols: string[] }) => (
    <thead>
      <tr className="bg-fog border-b border-mist">
        {cols.map((c, i) => (
          <th key={i} className="text-left px-4 py-2 text-[10px] font-semibold text-steel uppercase tracking-wider">{c}</th>
        ))}
      </tr>
    </thead>
  )

  if (stage.id === 1) {
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-steel leading-relaxed">
          Monitoring 23 regulatory sources: IMO, flag state administrations and regional MoUs. All instruments
          applicable to <strong className="text-navy font-medium">{vessel.name}</strong> ({vessel.flag} flag) are indexed.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[['IMO instruments', '14 active'], [`${vessel.flag} flag state`, 'Current'], ['Regional MoUs', 'Paris, Tokyo']].map(([label, value]) => (
            <div key={label} className="border border-mist rounded p-3 bg-white">
              <div className="text-[10px] text-steel mb-1">{label}</div>
              <div className="text-[12px] font-semibold text-navy">{value}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (stage.id === 2) {
    const reqs = [
      { id: 'REQ-0411', obligation: 'Fixed fire detection systems tested within 12 months', category: 'Safety' },
      { id: 'REQ-0412', obligation: 'SEEMP Part III with CII rating reviewed annually', category: 'Environmental' },
      { id: 'REQ-0410', obligation: 'All crew hold valid basic safety training certificates', category: 'Crew' },
      { id: 'REQ-0409', obligation: 'Emergency preparedness drills at required SOLAS frequency', category: 'Safety' },
    ]
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-steel leading-relaxed">
          <strong className="text-navy font-medium">{stage.count} discrete obligations</strong> extracted, each with an ID
          traceable to its source paragraph.
        </p>
        <Table>
          <Head cols={['ID', 'Obligation', 'Category']} />
          <tbody className="divide-y divide-mist">
            {reqs.map(r => (
              <tr key={r.id} className="hover:bg-fog">
                <td className="px-4 py-2 font-mono text-steel">{r.id}</td>
                <td className="px-4 py-2 text-navy">{r.obligation}</td>
                <td className="px-4 py-2 text-steel">{r.category}</td>
              </tr>
            ))}
            <tr><td colSpan={3} className="px-4 py-2 text-steel">+{stage.count - reqs.length} more requirements</td></tr>
          </tbody>
        </Table>
      </div>
    )
  }

  if (stage.id === 3) {
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-steel leading-relaxed">
          All <strong className="text-navy font-medium">{stage.count} requirements</strong> matched to{' '}
          <strong className="text-navy font-medium">{vessel.name}</strong> on vessel type, flag state, trading area and applicable conventions.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Vessel type', vessel.type],
            ['Flag state', vessel.flag],
            ['Trading area', vessel.route.split(' → ')[1] ?? '—'],
            ['Requirements assigned', String(stage.count)],
          ].map(([label, value]) => (
            <div key={label} className="border border-mist rounded p-3 bg-white">
              <div className="text-[10px] text-steel mb-1">{label}</div>
              <div className="text-[12px] font-semibold text-navy">{value}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (stage.id === 4) {
    const actions = [
      { id: 'ACT-1188', action: 'Upload updated SEEMP Part III signed by Master', due: '2026-07-31', status: stage.state === 'complete' ? 'done' : 'in-progress' },
      { id: 'ACT-1187', action: 'Collect signed SEAs for joining crew members', due: '2026-07-28', status: stage.state === 'complete' ? 'done' : 'in-progress' },
      { id: 'ACT-1186', action: 'Conduct fire and abandon-ship drill, upload report', due: '2026-08-01', status: 'done' },
      { id: 'ACT-1185', action: 'Update Ship Security Plan for current port rotation', due: '2026-07-26', status: stage.state === 'needs-review' ? 'overdue' : stage.state === 'complete' ? 'done' : 'open' },
    ]
    const tone: Record<string, string> = {
      done: 'text-emerald-700',
      'in-progress': 'text-maritime',
      open: 'text-steel',
      overdue: 'text-red-600',
    }
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-steel leading-relaxed">
          <strong className="text-navy font-medium">{stage.count} compliance actions</strong> generated, each linked to a
          requirement with a due date and evidence type.
        </p>
        <Table>
          <Head cols={['ID', 'Action', 'Due', 'Status']} />
          <tbody className="divide-y divide-mist">
            {actions.map(a => (
              <tr key={a.id} className="hover:bg-fog">
                <td className="px-4 py-2 font-mono text-steel">{a.id}</td>
                <td className="px-4 py-2 text-navy">{a.action}</td>
                <td className="px-4 py-2 font-mono text-steel">{a.due}</td>
                <td className={`px-4 py-2 font-medium capitalize ${tone[a.status]}`}>{a.status}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    )
  }

  if (stage.id === 5) {
    const ev = [
      { id: 'EV-0143', label: 'Fire and abandon-ship drill report', type: 'PDF', status: stage.state === 'needs-review' ? 'Flagged' : 'Accepted' },
      { id: 'EV-0142', label: 'ORB Part II, signed pages', type: 'PDF', status: 'Accepted' },
      { id: 'EV-0141', label: 'Fuel oil sample analysis certificate', type: 'Photo', status: stage.state === 'needs-review' ? 'Rejected' : 'Accepted' },
      { id: 'EV-0140', label: 'SEEMP Part III, Master signed', type: 'PDF', status: stage.state === 'complete' ? 'Accepted' : 'Pending' },
    ]
    const tone: Record<string, string> = {
      Accepted: 'text-emerald-700',
      Rejected: 'text-red-600',
      Pending: 'text-[#8a6410]',
      Flagged: 'text-red-600',
    }
    const icon: Record<string, React.ReactNode> = {
      PDF: <FileText size={11} className="text-steel" />,
      Photo: <Camera size={11} className="text-steel" />,
      Video: <Video size={11} className="text-steel" />,
    }
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-steel leading-relaxed">
          Evidence submitted by the vessel is validated automatically on format, completeness, and whether it satisfies
          the linked requirement.
        </p>
        <Table>
          <Head cols={['Ref', 'Document', 'Type', 'Status', '']} />
          <tbody className="divide-y divide-mist">
            {ev.map(e => (
              <tr key={e.id} className="hover:bg-fog">
                <td className="px-4 py-2 font-mono text-steel">{e.id}</td>
                <td className="px-4 py-2 text-navy">{e.label}</td>
                <td className="px-4 py-2"><div className="flex items-center gap-1.5 text-steel">{icon[e.type]}{e.type}</div></td>
                <td className={`px-4 py-2 font-medium ${tone[e.status]}`}>{e.status}</td>
                <td className="pr-4 py-2"><Eye size={11} className="text-mist" /></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    )
  }

  const items = [
    { id: 'APR-024', desc: 'SEEMP Part III, CII rating confirmed. DPA sign-off required to close REQ-0412.' },
    { id: 'APR-023', desc: 'Fire drill report accepted. Confirm the SOLAS schedule was met and all crew participated.' },
  ]
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-steel leading-relaxed">
        {stage.count === 0
          ? 'Blocked upstream. The approval queue opens once the flagged evidence is resolved.'
          : `${stage.count} items awaiting sign-off. Every agent-generated action needs explicit approval before the record is finalised.`}
      </p>
      {stage.count > 0 && (
        <div className="space-y-2">
          {items.map(item => {
            const isApproved = approved.includes(item.id)
            return (
              <div key={item.id} className={`border rounded p-4 ${isApproved ? 'border-emerald-200 bg-emerald-50/40' : 'border-mist bg-white'}`}>
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono text-steel mb-1">{item.id}</div>
                    <p className="text-[11px] text-navy/80 leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {isApproved ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                        <CheckCircle2 size={12} /> Approved
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => setApproved(p => p.filter(x => x !== item.id))}
                          className="px-3 py-1.5 rounded border border-mist text-[11px] text-steel hover:bg-fog transition-colors"
                        >
                          Return
                        </button>
                        <button
                          onClick={() => setApproved(p => [...p, item.id])}
                          className="px-3 py-1.5 rounded bg-ocean text-white text-[11px] font-medium hover:bg-maritime transition-colors flex items-center gap-1.5"
                        >
                          <Stamp size={11} /> Approve
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Root
// ═══════════════════════════════════════════════════════════════════════════

export default function DemoApp() {
  const [page, setPage] = useState('dashboard')

  const fleetIdx = pilFleet.findIndex(v => slug(v.name) === page)
  const fleetVessel = fleetIdx >= 0 ? pilFleet[fleetIdx]! : null
  const scenario = scenarioFleet.find(v => v.id === page) ?? null

  return (
    <div className="h-dvh flex bg-white overflow-hidden text-navy">
      <Sidebar active={page} onNav={setPage} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {fleetVessel ? (
          <>
            <TopBar
              title={fleetVessel.name}
              subtitle={`${fleetVessel.flag} · ${fleetVessel.teu > 0 ? `${fleetVessel.teu.toLocaleString()} TEU` : 'on order'}`}
              showBack
              onBack={() => setPage('dashboard')}
              onNav={setPage}
            />
            <FleetVesselPage vessel={fleetVessel} app={applicabilityFor(fleetVessel, fleetIdx)} />
          </>
        ) : scenario ? (
          <>
            <TopBar
              title={scenario.name}
              subtitle={`${scenario.type} · ${scenario.flag} · ${scenario.route}`}
              showBack
              onBack={() => setPage('dashboard')}
              onNav={setPage}
            />
            <ScenarioVesselPage vessel={scenario} />
          </>
        ) : (
          <>
            <TopBar title={`Fleet Overview · ${FLEET_SOURCE.operator}`} onNav={setPage} />
            <Dashboard onNav={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
