// ═══════════════════════════════════════════════════════════════════════════
//  Inline icon set for the demo.
//
//  The marketing site hand-writes every icon as inline SVG and carries no icon
//  library. The Figma Make export used lucide-react; these are stroke-matched
//  stand-ins so the demo can live here without pulling in a dependency.
//
//  All icons: 24x24 viewBox, 1.7 stroke, currentColor, round caps/joins.
// ═══════════════════════════════════════════════════════════════════════════

interface IconProps {
  size?: number
  className?: string
}

function Svg({ size = 14, className = '', children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/* ── Chrome ─────────────────────────────────────────────────────────────── */

export const BarChart2 = (p: IconProps) => (
  <Svg {...p}>
    <line x1="6" y1="20" x2="6" y2="13" />
    <line x1="12" y1="20" x2="12" y2="5" />
    <line x1="18" y1="20" x2="18" y2="9" />
  </Svg>
)

export const Search = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <line x1="15.5" y1="15.5" x2="20" y2="20" />
  </Svg>
)

export const ArrowLeft = (p: IconProps) => (
  <Svg {...p}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="11 18 5 12 11 6" />
  </Svg>
)

export const Bell = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </Svg>
)

export const Settings = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
  </Svg>
)

export const ChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <polyline points="9 5 16 12 9 19" />
  </Svg>
)

export const Eye = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
    <circle cx="12" cy="12" r="2.6" />
  </Svg>
)

export const CheckCircle2 = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="8 12.5 11 15.5 16 9.5" />
  </Svg>
)

/* ── Stage icons ────────────────────────────────────────────────────────── */

/** 1 · Regulation scanning */
export const ScanSearch = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
    <circle cx="11.5" cy="11.5" r="3" />
    <line x1="13.8" y1="13.8" x2="16" y2="16" />
  </Svg>
)

/** 2 · Requirement extraction */
export const ListFilter = (p: IconProps) => (
  <Svg {...p}>
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="7" y1="12" x2="17" y2="12" />
    <line x1="10" y1="17" x2="14" y2="17" />
  </Svg>
)

/** 3 · Vessel assignment */
export const Anchor = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="5.5" r="2.2" />
    <line x1="12" y1="7.7" x2="12" y2="20" />
    <line x1="7.5" y1="11" x2="16.5" y2="11" />
    <path d="M4 14.5a8 8 0 0 0 16 0" />
  </Svg>
)

/** 4 · Action assignment */
export const ClipboardList = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 4h6v2.5H9z" />
    <path d="M15 5h2a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 17 20H7a1.5 1.5 0 0 1-1.5-1.5v-12A1.5 1.5 0 0 1 7 5h2" />
    <line x1="9" y1="11" x2="15" y2="11" />
    <line x1="9" y1="15" x2="13" y2="15" />
  </Svg>
)

/** 5 · Evidence collection */
export const FolderOpen = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 8V6.5A1.5 1.5 0 0 1 4.5 5h4l2 2.5h6A1.5 1.5 0 0 1 18 9v1" />
    <path d="M3 8h17.2a1 1 0 0 1 .96 1.28l-2.2 8A1.5 1.5 0 0 1 17.5 18.5h-13A1.5 1.5 0 0 1 3 17Z" />
  </Svg>
)

/** 6 · DPA approval */
export const UserCheck = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9.5" cy="8" r="3.4" />
    <path d="M3 20a6.5 6.5 0 0 1 13 0" />
    <polyline points="16.5 12 18.5 14 22 10.5" />
  </Svg>
)

/* ── Evidence types ─────────────────────────────────────────────────────── */

export const FileText = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 3H7.5A1.5 1.5 0 0 0 6 4.5v15A1.5 1.5 0 0 0 7.5 21h9a1.5 1.5 0 0 0 1.5-1.5V7Z" />
    <polyline points="14 3 14 7 18 7" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="13" y2="16" />
  </Svg>
)

export const Camera = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2L8 5h8l1.5 2h2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5Z" />
    <circle cx="12" cy="13" r="3.2" />
  </Svg>
)

export const Video = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="7" width="12" height="10" rx="1.5" />
    <polygon points="15 11 21 8 21 16 15 13" />
  </Svg>
)

export const Stamp = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 4.5a3 3 0 0 1 6 0c0 2-1.5 2.5-1.5 4.5h-3C10.5 7 9 6.5 9 4.5Z" />
    <path d="M5 13.5h14V16H5z" />
    <line x1="4" y1="20" x2="20" y2="20" />
  </Svg>
)

/* ── Added for the working demo ─────────────────────────────────────────────
   Same 24x24 / 1.7-stroke convention as everything above. These three exist
   because the demo grew controls the aesthetic mock had no need for: a run
   trigger, a file upload, and a way to close the evidence viewer.            */

export const Upload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
    <polyline points="8 8 12 4 16 8" />
    <line x1="12" y1="4" x2="12" y2="15" />
  </Svg>
)

export const RotateCw = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 12a8 8 0 1 1-2.34-5.66" />
    <polyline points="20 4 20 9 15 9" />
  </Svg>
)

export const X = (p: IconProps) => (
  <Svg {...p}>
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </Svg>
)

export const AlertTriangle = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4 2.5 20h19L12 4z" />
    <line x1="12" y1="10" x2="12" y2="14" />
    <line x1="12" y1="17" x2="12" y2="17.01" />
  </Svg>
)
