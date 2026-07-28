import { clamp01 } from '@/lib/hooks'
import { PhotoLayer } from '@/components/ui'
import { IMAGES } from '@/data'

// ═══════════════════════════════════════════════════════════════════════════
//  Vector scenes
// ═══════════════════════════════════════════════════════════════════════════

export function CargoShip({ x = 0, scale = 1 }: { x?: number; scale?: number }) {
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

export function HeroScene({ y, reduced }: { y: number; reduced: boolean }) {
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
          <g transform="translate(1080 541)" opacity="0.9">
            <path d="M0 5 Q 42 -24, 96 -7 Q 132 -19, 178 3 Q 214 -9, 252 5 L252 9 L0 9 Z" fill="#6ea9c8" />
            <path d="M34 5 Q 84 -13, 142 1 Q 192 -11, 240 5 Z" fill="#4f86a6" opacity="0.55" />
            <rect x="150" y="-32" width="6.5" height="25" fill="#f3f6f7" />
            <rect x="150" y="-32" width="6.5" height="5" fill="#0d5c91" />
            <rect x="148" y="-36" width="10.5" height="4" fill="#0a2a43" />
            <circle cx="153.2" cy="-39" r="2.2" fill="#d9a441" className="anim-pulse-dot" />
            <ellipse cx="126" cy="13" rx="118" ry="5.5" fill="#dcecf2" opacity="0.2" />
          </g>
          <g transform={`translate(${810 + sceneShift} 550)`}>
            <g className={reduced ? '' : 'anim-drift'}>
              <CargoShip scale={shipScale * 1.12} />
              <ellipse cx={104 * shipScale * 1.12} cy={44 * shipScale * 1.12} rx={130 * shipScale * 1.12} ry="7" fill="#f3f6f7" opacity="0.3" />
            </g>
          </g>
        </svg>
      )}
    </div>
  )
}

export function BridgeScene() {
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

export function DeckScene() {
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

export function EngineScene() {
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

export function DocsScene() {
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

export function PortScene() {
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
      <g transform="translate(140 420) scale(1.15)">
        <g className="anim-drift">
          <CargoShip />
        </g>
      </g>
      <ellipse cx="380" cy="480" rx="240" ry="10" fill="#59b7c8" opacity="0.2" />
      <rect y="360" width="900" height="26" fill="#dcecf2" opacity="0.12" />
    </svg>
  )
}

export const sceneArt: Record<string, () => React.ReactElement> = {
  bridge: BridgeScene, deck: DeckScene, engine: EngineScene, docs: DocsScene, port: PortScene,
}
