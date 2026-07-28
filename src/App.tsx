import { useEffect, useRef, useState } from 'react'

// ═══════════════════════════════════════════════════════════════════════════
//  PHOTOGRAPHY SLOTS
//  Drop licensed maritime photo URLs here (blue hour, overcast, industrial).
//  When a URL is set, it renders behind the section's vector scene with a
//  navy exposure wash so typography stays legible. Leave '' to use the
//  coded scene alone.
// ═══════════════════════════════════════════════════════════════════════════
const IMAGES = {
  hero: '',        // open ocean, cargo vessel, slightly off-center, morning light
  bridge: '',      // ship bridge, panoramic windows
  deck: '',        // cargo deck, containers, steel
  engine: '',      // engine room, gauges, controlled lighting
  docs: '',        // documentation workspace
  port: '',        // dusk port arrival, cranes
  harbor: '',      // final harbor at dawn
}

// ═══════════════════════════════════════════════════════════════════════════
//  Hooks
// ═══════════════════════════════════════════════════════════════════════════

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

function useScrollY() {
  const [y, setY] = useState(0)
  useEffect(() => {
    let raf = 0
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setY(window.scrollY))
    }
    window.addEventListener('scroll', on, { passive: true })
    on()
    return () => {
      window.removeEventListener('scroll', on)
      cancelAnimationFrame(raf)
    }
  }, [])
  return y
}

/** 0→1 progress through a tall sticky section. */
function useProgress(ref: React.RefObject<HTMLElement | null>) {
  const [p, setP] = useState(0)
  useEffect(() => {
    let raf = 0
    const calc = () => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = el.offsetHeight - window.innerHeight
      if (total <= 0) return setP(1)
      const passed = Math.min(Math.max(-rect.top, 0), total)
      setP(passed / total)
    }
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(calc)
    }
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    calc()
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
      cancelAnimationFrame(raf)
    }
  }, [ref])
  return p
}

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1)
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/** Fades/slides children in when scrolled into view. */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && setInView(true)),
      { threshold: 0.18 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={`reveal ${inView ? 'in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

function CountUp({ target, suffix = '', duration = 1600, plain = false }: { target: number; suffix?: string; duration?: number; plain?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting || started.current) return
        started.current = true
        const t0 = performance.now()
        const tick = (t: number) => {
          const p = clamp01((t - t0) / duration)
          setVal(Math.round(easeOut(p) * target))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [target, duration])
  return <span ref={ref}>{plain ? String(val) : val.toLocaleString()}{suffix}</span>
}

// ═══════════════════════════════════════════════════════════════════════════
//  Shared bits
// ═══════════════════════════════════════════════════════════════════════════

function Label({ children, tone = 'ocean' }: { children: React.ReactNode; tone?: 'ocean' | 'cyan' | 'steel' }) {
  const color = tone === 'cyan' ? 'text-seacyan' : tone === 'steel' ? 'text-steel' : 'text-ocean'
  return (
    <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${color} mb-5`}>
      {children}
    </p>
  )
}

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M4 20 Q8 15, 12 20 Q15 23.5, 18 20 Q22 15, 26 20" stroke={light ? '#ffffff' : '#0d5c91'} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M4 13 Q8 8, 12 13 Q15 16.5, 18 13 Q22 8, 26 13" stroke={light ? '#59b7c8' : '#167db7'} strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span className={`font-semibold text-[15px] tracking-[0.26em] ${light ? 'text-white' : 'text-navy'}`}>MATSU</span>
    </span>
  )
}

function PhotoLayer({ src, wash = 'rgba(7,26,44,0.45)' }: { src: string; wash?: string }) {
  if (!src) return null
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <img src={src} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: wash }} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Data
// ═══════════════════════════════════════════════════════════════════════════

interface Vessel {
  id: string; name: string; type: string; flag: string; imo: string
  score: number; expiring: number; actions: number; port: string
  status: 'compliant' | 'attention' | 'risk'
}

const vessels: Vessel[] = [
  { id: '1', name: 'MV Adriatic Pioneer', type: 'Bulk Carrier', flag: 'MT', imo: '9876543', score: 96, expiring: 1, actions: 0, port: 'Rotterdam', status: 'compliant' },
  { id: '2', name: 'MV Pacific Endeavour', type: 'Container', flag: 'PA', imo: '9654321', score: 81, expiring: 4, actions: 2, port: 'Singapore', status: 'attention' },
  { id: '3', name: 'MV Nordic Resolve', type: 'Tanker', flag: 'NO', imo: '9432109', score: 62, expiring: 6, actions: 5, port: 'Hamburg', status: 'risk' },
  { id: '4', name: 'MV Strait Albatross', type: 'Bulk Carrier', flag: 'LR', imo: '9210987', score: 98, expiring: 0, actions: 0, port: 'Antwerp', status: 'compliant' },
  { id: '5', name: 'MV Coral Meridian', type: 'Container', flag: 'BS', imo: '9109876', score: 87, expiring: 2, actions: 1, port: 'Dubai', status: 'attention' },
]

const floatingDocs = [
  { title: 'Safety Management Certificate', meta: 'Expires in 21 days' },
  { title: 'PSC Inspection — Paris MOU', meta: '2 open deficiencies' },
  { title: 'ISM Internal Audit', meta: 'Finding NC-014 unresolved' },
  { title: 'Crew STCW Certification', meta: '3 renewals due' },
  { title: 'MARPOL IOPP Certificate', meta: 'Survey window open' },
  { title: 'Class Survey — Annual', meta: 'Evidence incomplete' },
  { title: 'Flag State Circular 04/26', meta: 'Applicability unreviewed' },
  { title: 'CII Trajectory', meta: 'Rating at risk — band D' },
]

const scatter = [
  { x: -36, y: -34, r: -8 }, { x: 24, y: -42, r: 6 }, { x: -14, y: -8, r: -3 }, { x: 38, y: -12, r: 9 },
  { x: -42, y: 16, r: 5 }, { x: 10, y: 24, r: -7 }, { x: -20, y: 42, r: 4 }, { x: 34, y: 34, r: -5 },
]

const scenes = [
  {
    key: 'bridge', kicker: 'The bridge',
    title: 'Fleet-wide visibility from one command center.',
    copy: 'Monitor vessel status, compliance posture, upcoming expirations, inspection readiness, and operational risk across the entire fleet.',
    photo: IMAGES.bridge,
  },
  {
    key: 'deck', kicker: 'The deck',
    title: 'Operational compliance connected to the real vessel.',
    copy: 'Assign actions, track evidence, manage corrective work, and connect compliance requirements directly to vessel operations.',
    photo: IMAGES.deck,
  },
  {
    key: 'engine', kicker: 'The engine room',
    title: 'Every requirement. Every action. Fully traceable.',
    copy: 'Maintain a complete operational record of inspections, findings, corrective actions, approvals, and supporting evidence.',
    photo: IMAGES.engine,
  },
  {
    key: 'docs', kicker: 'Documentation',
    title: 'Documentation that is always inspection-ready.',
    copy: 'Automatically organize certificates, track validity, surface missing evidence, and prepare vessels for audits and port-state control.',
    photo: IMAGES.docs,
  },
  {
    key: 'port', kicker: 'Port arrival',
    title: 'Arrive prepared.',
    copy: 'Identify compliance gaps before arrival, reduce inspection risk, and give shore teams and onboard crews a shared operational picture.',
    photo: IMAGES.port,
  },
]

const workflow = [
  { step: 'Regulation', example: 'SOLAS Ch. IX / ISM Code' },
  { step: 'Requirement', example: 'SMS internal audit, annual' },
  { step: 'Vessel', example: 'MV Nordic Resolve' },
  { step: 'Assigned action', example: 'Audit + close NC-014' },
  { step: 'Evidence', example: 'Report, photos, records' },
  { step: 'Approval', example: 'DPA sign-off' },
  { step: 'Audit record', example: 'Immutable, time-stamped' },
]

const regs = [
  { name: 'IMO', desc: 'Conventions, circulars, and MEPC / MSC resolutions, tracked at the source.' },
  { name: 'SOLAS', desc: 'Safety of life at sea — construction, equipment, and operational chapters.' },
  { name: 'MARPOL', desc: 'All six annexes, including Annex VI air emissions and EEXI / CII.' },
  { name: 'ISM Code', desc: 'Safety management systems, audits, and non-conformity handling.' },
  { name: 'ISPS Code', desc: 'Ship and port facility security assessments and plans.' },
  { name: 'MLC 2006', desc: 'Maritime labour conditions, certification, and inspections.' },
  { name: 'Flag states', desc: 'Requirement libraries and circulars for 65+ registries.' },
  { name: 'Port-state control', desc: 'Paris MOU, Tokyo MOU, and USCG inspection regimes and CIC campaigns.' },
  { name: 'Class societies', desc: 'Survey schedules and unified IACS requirements.' },
  { name: 'Regional rules', desc: 'EU MRV, EU ETS, FuelEU Maritime, and emission control areas.' },
]

const security = [
  'Role-based access control', 'Immutable audit history', 'Document version control',
  'Evidence traceability', 'Approval workflows', 'Multi-vessel permissions',
  'Enterprise authentication (SSO)', 'Secure document storage', 'Data export and regulatory reporting',
]


// ═══════════════════════════════════════════════════════════════════════════
//  Vector scenes
// ═══════════════════════════════════════════════════════════════════════════

function CargoShip({ x = 0, scale = 1 }: { x?: number; scale?: number }) {
  const boxColors = ['#0d5c91', '#8797a5', '#167db7', '#59b7c8', '#0a2a43', '#8797a5', '#0d5c91', '#167db7']
  return (
    <g transform={`translate(${x} 0) scale(${scale})`}>
      <path d="M0 40 L14 12 L196 12 L214 26 L208 40 Z" fill="#0a2a43" />
      <path d="M0 40 L14 12 L196 12 L214 26 L208 40 Z" fill="url(#hullShade)" opacity="0.5" />
      <rect x="4" y="18" width="200" height="2.5" fill="#f3f6f7" opacity="0.35" />
      <text x="24" y="34" fill="#dcecf2" opacity="0.6" fontSize="7" fontFamily="'JetBrains Mono', monospace" letterSpacing="1">MATSU · IMO 9876543</text>
      <g>
        {Array.from({ length: 10 }).map((_, col) => (
          <g key={col}>
            {Array.from({ length: col % 3 === 0 ? 2 : 3 }).map((__, row) => (
              <rect key={row} x={26 + col * 15} y={12 - (row + 1) * 7} width="13.5" height="6" rx="0.5"
                fill={boxColors[(col + row) % boxColors.length]} opacity={0.92 - row * 0.08} />
            ))}
          </g>
        ))}
      </g>
      <rect x="180" y="-24" width="22" height="36" rx="1" fill="#f3f6f7" />
      <rect x="182" y="-20" width="18" height="4" fill="#0a2a43" opacity="0.55" />
      <rect x="182" y="-13" width="18" height="4" fill="#0a2a43" opacity="0.4" />
      <rect x="188" y="-32" width="3" height="8" fill="#8797a5" />
      <rect x="12" y="-2" width="4" height="14" fill="#8797a5" />
    </g>
  )
}

function HeroScene({ y, reduced }: { y: number; reduced: boolean }) {
  const p = clamp01(y / 640)
  const shipScale = reduced ? 1 : 1 + p * 0.16
  const sceneShift = reduced ? 0 : p * 60
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <PhotoLayer src={IMAGES.hero} wash="rgba(220,236,242,0.15)" />
      {!IMAGES.hero && (
        <svg className="w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f3f6f7" />
              <stop offset="0.55" stopColor="#dcecf2" />
              <stop offset="1" stopColor="#bcd9e6" />
            </linearGradient>
            <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#a8cddf" />
              <stop offset="0.4" stopColor="#6ea9c8" />
              <stop offset="1" stopColor="#167db7" />
            </linearGradient>
            <linearGradient id="hullShade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#05101a" stopOpacity="0" />
              <stop offset="1" stopColor="#05101a" stopOpacity="0.8" />
            </linearGradient>
            <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="mistBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f3f6f7" stopOpacity="0" />
              <stop offset="0.5" stopColor="#f3f6f7" stopOpacity="0.85" />
              <stop offset="1" stopColor="#f3f6f7" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="1440" height="560" fill="url(#sky)" />
          <circle cx="420" cy="330" r="190" fill="url(#sun)" />
          <rect y="540" width="1440" height="360" fill="url(#sea)" />
          <rect y="520" width="1440" height="70" fill="url(#mistBand)" />
          <g opacity="0.5" stroke="#f3f6f7">
            <line x1="0" y1="600" x2="1440" y2="600" strokeWidth="1" opacity="0.35" />
            <line x1="0" y1="650" x2="1440" y2="650" strokeWidth="1.2" opacity="0.28" />
            <line x1="0" y1="712" x2="1440" y2="712" strokeWidth="1.5" opacity="0.22" />
            <line x1="0" y1="790" x2="1440" y2="790" strokeWidth="2" opacity="0.16" />
          </g>
          <rect x="330" y="545" width="180" height="330" fill="#ffffff" opacity="0.10" transform="skewX(-6)" />
          <g transform={`translate(${790 + sceneShift} 546)`} className={reduced ? '' : 'anim-drift'}>
            <CargoShip scale={shipScale} />
            <ellipse cx={104 * shipScale} cy={44 * shipScale} rx={130 * shipScale} ry="7" fill="#f3f6f7" opacity="0.3" />
          </g>
        </svg>
      )}
    </div>
  )
}

function BridgeScene() {
  return (
    <svg className="w-full h-full" viewBox="0 0 900 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="900" height="560" fill="#071a2c" />
      <rect x="60" y="80" width="780" height="220" rx="6" fill="#0a2a43" />
      <rect x="72" y="92" width="756" height="196" rx="4" fill="#dcecf2" />
      <rect x="72" y="92" width="756" height="120" fill="#c5dde9" />
      <rect x="72" y="206" width="756" height="82" fill="#6ea9c8" />
      <line x1="72" y1="207" x2="828" y2="207" stroke="#f3f6f7" strokeWidth="2" opacity="0.7" />
      <g transform="translate(560 196) scale(0.55)">
        <CargoShip />
      </g>
      <rect x="60" y="80" width="780" height="220" rx="6" fill="none" stroke="#05101a" strokeWidth="10" />
      <line x1="255" y1="85" x2="255" y2="295" stroke="#05101a" strokeWidth="10" />
      <line x1="450" y1="85" x2="450" y2="295" stroke="#05101a" strokeWidth="10" />
      <line x1="645" y1="85" x2="645" y2="295" stroke="#05101a" strokeWidth="10" />
      <rect x="60" y="340" width="780" height="150" rx="8" fill="#0a2a43" />
      {[110, 320, 530, 700].map((x, i) => (
        <g key={i}>
          <rect x={x} y="368" width={i === 1 ? 170 : 130} height="86" rx="4" fill="#05101a" stroke="#0d5c91" strokeWidth="1" />
          <rect x={x + 12} y="382" width={i === 1 ? 146 : 106} height="6" rx="2" fill="#59b7c8" opacity="0.8" />
          <rect x={x + 12} y="398" width={(i === 1 ? 146 : 106) * 0.6} height="5" rx="2" fill="#167db7" opacity="0.7" />
          <rect x={x + 12} y="412" width={(i === 1 ? 146 : 106) * 0.8} height="5" rx="2" fill="#0d5c91" opacity="0.7" />
          <circle cx={x + 20} cy="438" r="4" fill={i === 3 ? '#d9a441' : '#59b7c8'} className="anim-pulse-dot" />
        </g>
      ))}
    </svg>
  )
}

function DeckScene() {
  const cols = ['#0d5c91', '#8797a5', '#167db7', '#0a2a43', '#59b7c8']
  return (
    <svg className="w-full h-full" viewBox="0 0 900 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="900" height="560" fill="#dcecf2" />
      <rect y="0" width="900" height="180" fill="#c5dde9" />
      <path d="M0 560 L340 180 L560 180 L900 560 Z" fill="#8797a5" />
      <path d="M0 560 L340 180 L560 180 L900 560 Z" fill="#f3f6f7" opacity="0.25" />
      <path d="M430 180 L450 180 L440 560 L400 560 Z" fill="#d9a441" opacity="0.75" />
      {Array.from({ length: 5 }).map((_, row) => {
        const t = row / 4
        const y = 210 + t * 300
        const w = 90 + t * 200
        const h = 26 + t * 34
        return (
          <g key={row}>
            <rect x={450 - w - 20 - t * 60} y={y} width={w} height={h} rx="2" fill={cols[row % 5]} />
            <rect x={470 + t * 60} y={y} width={w} height={h} rx="2" fill={cols[(row + 2) % 5]} />
            <rect x={450 - w - 20 - t * 60} y={y + h * 0.4} width={w} height="2" fill="#05101a" opacity="0.25" />
            <rect x={470 + t * 60} y={y + h * 0.4} width={w} height="2" fill="#05101a" opacity="0.25" />
          </g>
        )
      })}
      <g fontFamily="'JetBrains Mono', monospace" fontSize="11" fill="#071a2c">
        <rect x="596" y="252" width="128" height="26" rx="3" fill="#ffffff" opacity="0.92" />
        <text x="608" y="269">BAY 14 · SECURED</text>
        <line x1="596" y1="265" x2="560" y2="290" stroke="#071a2c" strokeWidth="1" />
        <rect x="150" y="360" width="150" height="26" rx="3" fill="#ffffff" opacity="0.92" />
        <text x="162" y="377">LASHING · VERIFIED</text>
        <line x1="300" y1="373" x2="340" y2="400" stroke="#071a2c" strokeWidth="1" />
      </g>
    </svg>
  )
}

function EngineScene() {
  return (
    <svg className="w-full h-full" viewBox="0 0 900 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="900" height="560" fill="#05101a" />
      <rect y="0" width="900" height="560" fill="#0a2a43" opacity="0.4" />
      {[80, 160, 240].map((y, i) => (
        <g key={i}>
          <rect x="-20" y={y} width="940" height="22" rx="11" fill="#8797a5" opacity={0.5 - i * 0.1} />
          <rect x="-20" y={y + 4} width="940" height="4" rx="2" fill="#f3f6f7" opacity="0.25" />
        </g>
      ))}
      {[140, 400, 660].map((x, i) => (
        <rect key={i} x={x} y="60" width="18" height="500" rx="9" fill="#8797a5" opacity="0.35" />
      ))}
      {[{ x: 250, v: 0.62 }, { x: 450, v: 0.38 }, { x: 650, v: 0.8 }].map((g, i) => (
        <g key={i} transform={`translate(${g.x} 400)`}>
          <circle r="64" fill="#071a2c" stroke="#8797a5" strokeWidth="3" />
          <circle r="54" fill="none" stroke="#0d5c91" strokeWidth="1" opacity="0.7" />
          {Array.from({ length: 9 }).map((_, t) => {
            const a = (-210 + t * 30) * (Math.PI / 180)
            return <line key={t} x1={Math.cos(a) * 44} y1={Math.sin(a) * 44} x2={Math.cos(a) * 52} y2={Math.sin(a) * 52} stroke="#dcecf2" strokeWidth="2" opacity="0.6" />
          })}
          {(() => {
            const a = (-210 + g.v * 240) * (Math.PI / 180)
            return <line x1="0" y1="0" x2={Math.cos(a) * 42} y2={Math.sin(a) * 42} stroke={g.v > 0.75 ? '#d9a441' : '#59b7c8'} strokeWidth="3.5" strokeLinecap="round" />
          })()}
          <circle r="5" fill="#dcecf2" />
        </g>
      ))}
      <rect x="0" y="0" width="900" height="560" fill="url(#engGlow)" opacity="0.5" />
      <defs>
        <radialGradient id="engGlow" cx="0.8" cy="0.15" r="0.7">
          <stop offset="0" stopColor="#d9a441" stopOpacity="0.28" />
          <stop offset="1" stopColor="#d9a441" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  )
}

function DocsScene() {
  const rows = [
    { name: 'Safety Management Certificate', ok: true },
    { name: 'IOPP Certificate (MARPOL)', ok: true },
    { name: 'Class Survey — Annual', ok: false },
    { name: 'Minimum Safe Manning', ok: true },
  ]
  return (
    <svg className="w-full h-full" viewBox="0 0 900 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="900" height="560" fill="#f3f6f7" />
      <rect x="90" y="70" width="530" height="420" rx="8" fill="#ffffff" stroke="#dcecf2" strokeWidth="2" />
      <rect x="120" y="104" width="200" height="14" rx="3" fill="#071a2c" />
      <rect x="120" y="128" width="130" height="8" rx="3" fill="#8797a5" opacity="0.6" />
      {rows.map((r, i) => (
        <g key={i} transform={`translate(120 ${170 + i * 72})`}>
          <rect width="470" height="54" rx="6" fill="#f3f6f7" />
          <rect x="14" y="13" width="20" height="26" rx="2" fill="#ffffff" stroke="#8797a5" strokeWidth="1.4" />
          <line x1="18" y1="21" x2="30" y2="21" stroke="#8797a5" strokeWidth="1.4" />
          <line x1="18" y1="27" x2="30" y2="27" stroke="#8797a5" strokeWidth="1.4" />
          <text x="48" y="25" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="600" fill="#071a2c">{r.name}</text>
          <text x="48" y="43" fontFamily="'JetBrains Mono', monospace" fontSize="10" fill="#8797a5">{r.ok ? 'VALID · EVIDENCE COMPLETE' : 'EVIDENCE MISSING · 1 ITEM'}</text>
          <circle cx="436" cy="27" r="11" fill={r.ok ? '#167db7' : '#d9a441'} />
          {r.ok
            ? <path d="M430 27 l4 4 l8 -8" stroke="#ffffff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            : <text x="433" y="32" fontSize="14" fontWeight="700" fill="#071a2c">!</text>}
        </g>
      ))}
      <rect x="660" y="120" width="170" height="240" rx="10" fill="#071a2c" />
      <rect x="672" y="140" width="146" height="90" rx="4" fill="#0d5c91" opacity="0.6" />
      <rect x="672" y="242" width="146" height="8" rx="3" fill="#59b7c8" opacity="0.8" />
      <rect x="672" y="260" width="100" height="8" rx="3" fill="#8797a5" opacity="0.6" />
      <rect x="672" y="292" width="146" height="30" rx="4" fill="#167db7" />
    </svg>
  )
}

function PortScene() {
  return (
    <svg className="w-full h-full" viewBox="0 0 900 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a2a43" />
          <stop offset="0.6" stopColor="#0d5c91" />
          <stop offset="1" stopColor="#167db7" />
        </linearGradient>
      </defs>
      <rect width="900" height="560" fill="url(#dusk)" />
      <rect y="380" width="900" height="180" fill="#071a2c" />
      <g stroke="#05101a" strokeWidth="7" opacity="0.9">
        {[120, 330, 560, 760].map((x, i) => (
          <g key={i}>
            <line x1={x} y1="380" x2={x} y2="220" />
            <line x1={x} y1="240" x2={x + 130} y2="240" />
            <line x1={x + 96} y1="240" x2={x + 96} y2="290" strokeWidth="3" />
            <line x1={x - 24} y1="380" x2={x} y2="300" strokeWidth="4" />
          </g>
        ))}
      </g>
      {[150, 260, 410, 500, 640, 720, 820].map((x, i) => (
        <circle key={i} cx={x} cy={i % 2 ? 356 : 344} r="3" fill="#d9a441" className="anim-pulse-dot" opacity="0.9" />
      ))}
      <g transform="translate(140 420) scale(1.15)" className="anim-drift">
        <CargoShip />
      </g>
      <ellipse cx="380" cy="480" rx="240" ry="10" fill="#59b7c8" opacity="0.2" />
      <rect y="360" width="900" height="26" fill="#dcecf2" opacity="0.12" />
    </svg>
  )
}

const sceneArt: Record<string, () => React.ReactElement> = {
  bridge: BridgeScene, deck: DeckScene, engine: EngineScene, docs: DocsScene, port: PortScene,
}

// ═══════════════════════════════════════════════════════════════════════════
//  Navigation
// ═══════════════════════════════════════════════════════════════════════════

function Nav() {
  const y = useScrollY()
  const scrolled = y > 40
  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-navy/85 backdrop-blur-md border-b border-white/10' : 'bg-transparent'}`}>
      <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#top" aria-label="Matsu home"><Wordmark light={scrolled} /></a>
        <div className={`hidden lg:flex items-center gap-8 text-[13px] font-medium transition-colors ${scrolled ? 'text-mist/80' : 'text-navy/75'}`}>
          {[['Platform', '#platform'], ['Voyage', '#solutions'], ['Regulations', '#regulations'], ['Security', '#security'], ['Company', '#company']].map(([l, h]) => (
            <a key={l} href={h} className="hover:opacity-70 transition-opacity">{l}</a>
          ))}
        </div>
        <a href="#cta" className={`text-[13px] font-semibold px-4 sm:px-5 py-2.5 rounded-md transition-all ${scrolled ? 'bg-ocean text-white hover:bg-maritime' : 'bg-navy text-white hover:bg-deepsea'}`}>
          <span className="sm:hidden">Request demo</span>
          <span className="hidden sm:inline">Request a demonstration</span>
        </a>
      </div>
    </nav>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  1 · Cinematic hero
// ═══════════════════════════════════════════════════════════════════════════

function Hero() {
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
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-maritime mb-6">Maritime compliance platform</p>
        <h1 className="font-bold text-navy text-[44px] md:text-[72px] lg:text-[92px] leading-[0.98] tracking-[-0.03em] max-w-4xl">
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

// ═══════════════════════════════════════════════════════════════════════════
//  2 · Beneath the surface
// ═══════════════════════════════════════════════════════════════════════════

function Depths() {
  const ref = useRef<HTMLElement>(null)
  const raw = useProgress(ref)
  const reduced = useReducedMotion()
  const morph = reduced ? 1 : easeOut(clamp01((raw - 0.28) / 0.44))
  const resolved = morph > 0.55

  return (
    <section ref={ref} className="relative" style={{ height: '320vh' }}>
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
          <div className="relative min-h-[190px] md:min-h-[210px] max-w-3xl">
            <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: resolved ? 0 : 1 }}>
              <Label tone="cyan">Beneath the surface</Label>
              <h2 className="font-bold text-white text-3xl md:text-[52px] leading-[1.05] tracking-[-0.02em]">
                Maritime compliance is not one document.
              </h2>
              <p className="mt-5 text-base md:text-lg text-mist/70 leading-relaxed max-w-xl">
                It is a continuously changing system of regulations, evidence, deadlines, inspections, people, and operational risk.
              </p>
            </div>
            <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: resolved ? 1 : 0 }}>
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

// ═══════════════════════════════════════════════════════════════════════════
//  4 · Interactive ship walkthrough
// ═══════════════════════════════════════════════════════════════════════════

function Walkthrough() {
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

// ═══════════════════════════════════════════════════════════════════════════
//  5 · Platform reveal (blueprint → dashboard)
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

function Dashboard() {
  const [sel, setSel] = useState<string>('3')
  const v = vessels.find(x => x.id === sel)!
  const fleetRate = Math.round(vessels.reduce((a, b) => a + b.score, 0) / vessels.length)
  const circ = 2 * Math.PI * 54

  return (
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
            <button className="mt-5 w-full text-sm font-semibold text-white bg-navy py-3 rounded-md hover:bg-deepsea transition-colors">
              Open vessel record →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PlatformReveal() {
  return (
    <section id="platform" className="bg-fog py-28 lg:py-36 px-6">
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <Label>The platform</Label>
          <h2 className="font-bold text-navy text-4xl md:text-6xl tracking-[-0.02em] max-w-2xl leading-[1.03]">
            One platform. Total compliance visibility.
          </h2>
          <p className="mt-6 text-lg text-navy/60 max-w-xl leading-relaxed">
            Connect shore teams, vessel crews, operational records, and regulatory requirements through a single source of truth.
          </p>
        </Reveal>
        <Reveal delay={150} className="mt-16">
          <Blueprint />
        </Reveal>
        <Reveal delay={100} className="mt-4">
          <Dashboard />
        </Reveal>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  6 · Workflow
// ═══════════════════════════════════════════════════════════════════════════

function Workflow() {
  return (
    <section className="bg-white py-28 lg:py-36 px-6 border-t border-fog">
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <Label>Compliance workflow</Label>
          <h2 className="font-bold text-navy text-4xl md:text-6xl tracking-[-0.02em] leading-[1.03] max-w-2xl">
            From regulation to verified action.
          </h2>
          <p className="mt-6 text-lg text-navy/60 max-w-xl leading-relaxed">
            Translate regulatory requirements into structured workflows that teams can understand, execute, verify, and audit.
          </p>
        </Reveal>
        <div className="mt-16 grid md:grid-cols-7 gap-y-8 md:gap-0">
          {workflow.map((w, i) => (
            <Reveal key={w.step} delay={i * 110} className="relative">
              <div className="md:px-2">
                <div className="flex items-center gap-3 md:block">
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-mist text-maritime text-[13px] font-bold md:mb-4">{i + 1}</span>
                  {i < workflow.length - 1 && (
                    <span className="hidden md:block absolute top-[18px] left-[calc(50%+26px)] right-[-50%] h-px bg-mist" aria-hidden="true" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-navy">{w.step}</p>
                    <p className="text-[11.5px] text-steel mt-1 leading-snug">{w.example}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  7 · Fleet command center
// ═══════════════════════════════════════════════════════════════════════════

function CommandCenter() {
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

// ═══════════════════════════════════════════════════════════════════════════
//  8 · Regulatory intelligence
// ═══════════════════════════════════════════════════════════════════════════

function Regulatory() {
  return (
    <section id="regulations" className="bg-white py-28 lg:py-36 px-6">
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <Label>Regulatory intelligence</Label>
          <h2 className="font-bold text-navy text-4xl md:text-6xl tracking-[-0.02em] leading-[1.03] max-w-3xl">
            Regulation changes. Your system should change with it.
          </h2>
          <p className="mt-6 text-lg text-navy/60 max-w-xl leading-relaxed">
            Track evolving maritime requirements and connect regulatory updates directly to the vessels, documents, and workflows they affect.
          </p>
        </Reveal>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-5 gap-px bg-fog border border-fog rounded-lg overflow-hidden">
          {regs.map((r, i) => (
            <Reveal key={r.name} delay={(i % 5) * 70} className="bg-white">
              <div className="p-6 h-full hover:bg-fog/60 transition-colors">
                <p className="text-[15px] font-bold text-navy">{r.name}</p>
                <p className="text-[12.5px] text-steel leading-relaxed mt-2">{r.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  9 · Security and auditability
// ═══════════════════════════════════════════════════════════════════════════

function Security() {
  const trail = [
    { t: '14:02:11Z', e: 'Certificate uploaded — IOPP, MV Coral Meridian', who: 'Chief Officer' },
    { t: '14:02:38Z', e: 'Validity verified against class records', who: 'System' },
    { t: '15:11:07Z', e: 'Corrective action NC-014 marked complete', who: 'Master' },
    { t: '15:40:52Z', e: 'Evidence approved — audit record sealed', who: 'DPA' },
  ]
  return (
    <section id="security" className="py-28 lg:py-36 px-6" style={{ background: 'linear-gradient(to bottom, #05101a, #0a2a43)' }}>
      <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-16 items-start">
        <div>
          <Reveal>
            <Label tone="cyan">Security and auditability</Label>
            <h2 className="font-bold text-white text-4xl md:text-6xl tracking-[-0.02em] leading-[1.03]">
              Built for accountability.
            </h2>
            <p className="mt-6 text-lg text-mist/70 max-w-md leading-relaxed">
              Maintain a complete, time-stamped record of every document, action, approval, inspection, and change.
            </p>
          </Reveal>
          <div className="mt-10 grid sm:grid-cols-2 gap-x-8 gap-y-3.5">
            {security.map((s, i) => (
              <Reveal key={s} delay={i * 60}>
                <div className="flex items-center gap-3 text-[14px] text-mist/85">
                  <span className="w-1.5 h-1.5 rounded-full bg-seacyan flex-shrink-0" aria-hidden="true" />
                  {s}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal delay={200}>
          <div className="rounded-xl border border-white/12 bg-white/[0.04] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <span className="text-sm font-semibold text-mist">Audit history</span>
              <span className="text-[10px] font-mono text-seacyan tracking-[0.14em]">SAMPLE RECORD</span>
            </div>
            <div className="p-6 space-y-5">
              {trail.map((r, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center" aria-hidden="true">
                    <span className="w-2 h-2 rounded-full bg-ocean mt-1.5" />
                    {i < trail.length - 1 && <span className="w-px flex-1 bg-white/12 mt-1" />}
                  </div>
                  <div className="pb-1">
                    <p className="text-[11px] font-mono text-steel">{r.t} · {r.who}</p>
                    <p className="text-[13.5px] text-mist mt-1">{r.e}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  10 · Industry credibility
// ═══════════════════════════════════════════════════════════════════════════

function Credibility() {
  // Figures verified July 2026: FuelEU Maritime binding since Jan 2025, first
  // penalties issued from June 2026; EU ETS maritime coverage stepped
  // 40% (2024) → 70% (2025) → 100% (2026); IMO CII reduction factor 11% in
  // 2026; IMO 2023 GHG Strategy targets net-zero "by or around" 2050.
  const nums = [
    { n: 100, s: '%', label: 'EU ETS coverage of in-scope voyage emissions since January 2026' },
    { n: 2, s: '%', label: 'GHG-intensity cut FuelEU Maritime enforces today — penalties live since June 2026' },
    { n: 11, s: '%', label: 'CII reduction factor applied to vessel carbon intensity in 2026' },
    { n: 2050, s: '', plain: true, label: 'IMO net-zero horizon for international shipping emissions' },
  ]
  return (
    <section id="credibility" className="bg-white py-28 lg:py-36 px-6 border-t border-fog">
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <Label>The regulatory wall</Label>
          <h2 className="font-bold text-navy text-4xl md:text-6xl tracking-[-0.02em] leading-[1.03] max-w-3xl">
            The rules have already changed. The tooling hasn't.
          </h2>
        </Reveal>
        <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-10">
          {nums.map((m, i) => (
            <Reveal key={m.label} delay={i * 100}>
              <p className="text-4xl md:text-5xl font-bold text-navy tracking-[-0.02em]">
                <CountUp target={m.n} suffix={m.s} plain={'plain' in m && m.plain} />
              </p>
              <p className="text-[13px] text-steel mt-2.5 leading-snug max-w-[210px]">{m.label}</p>
            </Reveal>
          ))}
        </div>
        <Reveal delay={100} className="mt-16 max-w-3xl">
          <p className="text-2xl md:text-[32px] leading-snug font-medium text-navy tracking-[-0.01em]">
            FuelEU penalties are live. EU ETS reached full coverage. CII tightens every year. The fleets that stay ahead treat compliance as an operating system, not a filing cabinet.
          </p>
          <p className="mt-6 text-sm text-steel">
            We're onboarding design-partner fleets now.{' '}
            <a href="mailto:marco0111ml@gmail.com?subject=Matsu%20design%20partner" className="text-ocean font-medium hover:text-maritime transition-colors">
              Become a design partner →
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  11 · Final harbor + CTA
// ═══════════════════════════════════════════════════════════════════════════

function Harbor() {
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
            <g transform="translate(300 512)" className="anim-drift">
              <CargoShip scale={1.05} />
              <ellipse cx="110" cy="48" rx="150" ry="8" fill="#dcecf2" opacity="0.25" />
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

// ═══════════════════════════════════════════════════════════════════════════
//  Footer
// ═══════════════════════════════════════════════════════════════════════════

function Footer() {
  const cols: { h: string; l: [string, string][] }[] = [
    {
      h: 'Explore',
      l: [['Platform', '#platform'], ['Aboard the vessel', '#solutions'], ['Regulations', '#regulations'], ['Security', '#security']],
    },
    {
      h: 'Get in touch',
      l: [['Request a demonstration', 'mailto:marco0111ml@gmail.com?subject=Matsu%20demo%20request'], ['Contact', 'mailto:marco0111ml@gmail.com']],
    },
  ]
  return (
    <footer id="company" className="bg-abyss border-t border-white/8">
      <div className="max-w-[1280px] mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          <div className="col-span-2">
            <Wordmark light />
            <p className="mt-4 text-sm text-steel leading-relaxed max-w-xs">
              The operating system for maritime compliance — vessels, documents, inspections, and regulation in one operational picture.
            </p>
          </div>
          {cols.map(c => (
            <div key={c.h}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mist/70 mb-4">{c.h}</p>
              <ul className="space-y-2.5">
                {c.l.map(([x, h]) => (
                  <li key={x}><a href={h} className="text-[13px] text-steel hover:text-mist transition-colors">{x}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/8 pt-7">
          <span className="text-xs text-steel/70 font-mono">© 2026 MATSU AI</span>
        </div>
      </div>
    </footer>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  App
// ═══════════════════════════════════════════════════════════════════════════

export default function App() {
  return (
    <div className="min-h-screen bg-white text-navy antialiased">
      <a href="#platform" className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:bg-white focus:text-navy focus:px-4 focus:py-2">
        Skip to platform overview
      </a>
      <Nav />
      <Hero />
      <Depths />
      <Walkthrough />
      <PlatformReveal />
      <Workflow />
      <CommandCenter />
      <Regulatory />
      <Security />
      <Credibility />
      <Harbor />
      <Footer />
    </div>
  )
}
