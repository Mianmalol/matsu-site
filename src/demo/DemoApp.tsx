// ═══════════════════════════════════════════════════════════════════════════
//  PRODUCT DEMO · /demo
//
//  A working demo, not a mock. Five invented Matsu Lines hulls, a committed
//  corpus of real IMO instruments, and five agents that genuinely run against
//  it. Stage 6 is a human decision and no model touches it.
//
//  ── Where things live ─────────────────────────────────────────────────────
//    shared/corpus.ts     the instruments, and the deterministic applicability
//                         rules that decide which bite for which hull
//    shared/assemble.ts   raw stage output -> the shapes rendered below
//    api/agent/*          the agents, behind Clerk auth
//    src/demo/state.ts    committed canonical run + this session's overlay
//    src/demo/runner.ts   browser-side orchestration, one request per stage
//
//  ── On the visual layer ───────────────────────────────────────────────────
//  Formatting still follows the original Figma Make export — double quotes,
//  semicolons, arbitrary-hex Tailwind — because the design may be re-exported
//  and keeping the JSX diffable against that export is worth more than internal
//  consistency in a file nothing else imports. The markup and classes are
//  unchanged from the mock. Only the data behind them is different, plus the
//  controls the mock had no need for: a run trigger, an evidence viewer, a file
//  upload, and a return-to-vessel action.
//
//  ── On honesty ────────────────────────────────────────────────────────────
//  The fleet is invented. The regulations are real but summarised, not quoted.
//  Generated evidence is labelled synthetic wherever it appears, because a
//  system that both writes the evidence and grades it is not assurance and
//  should not look like it. Nothing here is compliance advice.
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import {
  ScanSearch, ListFilter, Anchor, ClipboardList,
  FolderOpen, UserCheck, ChevronRight,
  ArrowLeft, Bell, Settings, Search, BarChart2,
  CheckCircle2, FileText, Camera, Video, Eye, Stamp,
  Upload, RotateCw, X, AlertTriangle,
} from "./icons.js";
import { AccountButton } from "@/auth/AuthGate";
import { CORPUS, CORPUS_BY_ID, CORPUS_VERSION, CURRENT_THROUGH, applicableRecords } from "../../shared/corpus.js";
import { FLEET, OPERATOR, typeLabel } from "../../shared/fleet.js";
import { STAGE_LABELS, unresolvedEvidence } from "../../shared/assemble.js";
import type {
  AgentEvent, ApprovalItem, ComplianceAction, EvidenceItem,
  Requirement, StageStatus, Vessel, VesselRun,
} from "../../shared/types.js";
import canonicalJson from "../data/canonicalRun.json";
import {
  eventKey, loadOverlay, project, reducer, saveOverlay,
  type Overlay, type Projection,
} from "./state.js";
import { RunError, runVessel, validateUpload, MAX_UPLOAD_BYTES } from "./runner.js";

// ── STAGE TEMPLATES ───────────────────────────────────────────────────────────

const ST = [
  { id: 1, icon: ScanSearch },
  { id: 2, icon: ListFilter },
  { id: 3, icon: Anchor },
  { id: 4, icon: ClipboardList },
  { id: 5, icon: FolderOpen },
  { id: 6, icon: UserCheck },
] as const;

// ── SHARED ────────────────────────────────────────────────────────────────────

const CHIP: Record<StageStatus, { bg: string; text: string; border: string; label: string }> = {
  complete:       { bg: "bg-emerald-50",  text: "text-emerald-800",  border: "border-emerald-200", label: "Complete"     },
  active:         { bg: "bg-blue-50",     text: "text-[#2d6aad]",    border: "border-blue-200",    label: "In Progress"  },
  "needs-review": { bg: "bg-amber-50",    text: "text-amber-800",    border: "border-amber-200",   label: "Needs Review" },
  pending:        { bg: "bg-gray-50",     text: "text-gray-500",     border: "border-gray-200",    label: "Pending"      },
};

function StatusChip({ status }: { status: StageStatus }) {
  const s = CHIP[status];
  return (
    <span className={`inline-flex items-center px-1.5 py-[2px] rounded text-[10px] font-medium border ${s.bg} ${s.text} ${s.border}`}>
      {s.label}
    </span>
  );
}

function StagePips({ stages }: { stages: { id: number; status: StageStatus }[] }) {
  return (
    <div className="flex items-center gap-px">
      {stages.map(s => {
        const c = s.status === "complete" ? "bg-emerald-500" : s.status === "active" ? "bg-[#2d6aad]" : s.status === "needs-review" ? "bg-amber-500" : "bg-gray-200";
        return <span key={s.id} className={`block w-5 h-[3px] ${c}`} />;
      })}
    </div>
  );
}

// ── SPARKLINE ─────────────────────────────────────────────────────────────────
//
//  Stands in for the export's recharts <LineChart>. Seven points is not worth
//  ~100KB gzipped.
//
//  It measures its container and draws in real pixels rather than scaling a
//  viewBox. A viewBox stretched to fill a fixed-height box either distorts the
//  stroke and the label text, or letterboxes and drifts the labels off their
//  data points. Measuring avoids both, which is also what ResponsiveContainer
//  does under the hood.

/**
 * d3-shape's curveMonotoneX, which is what recharts `type="monotone"` uses:
 * Fritsch–Carlson tangents, clamped so the curve never overshoots a data point.
 */
function monotonePath(pts: { x: number; y: number }[]): string {
  const n = pts.length;
  if (n < 2) return "";

  const secant: number[] = [];
  for (let i = 0; i < n - 1; i++) secant.push((pts[i + 1].y - pts[i].y) / (pts[i + 1].x - pts[i].x));

  const m: number[] = [secant[0]];
  for (let i = 1; i < n - 1; i++) {
    m.push(secant[i - 1] * secant[i] <= 0 ? 0 : (secant[i - 1] + secant[i]) / 2);
  }
  m.push(secant[n - 2]);

  for (let i = 0; i < n - 1; i++) {
    if (secant[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / secant[i];
    const b = m[i + 1] / secant[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * secant[i];
      m[i + 1] = t * b * secant[i];
    }
  }

  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const dx = (pts[i + 1].x - pts[i].x) / 3;
    d += ` C${pts[i].x + dx} ${pts[i].y + m[i] * dx} ${pts[i + 1].x - dx} ${pts[i + 1].y - m[i + 1] * dx} ${pts[i + 1].x} ${pts[i + 1].y}`;
  }
  return d;
}

function Sparkline({ data, max }: { data: { h: string; v: number }[]; max: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = 80, PAD_L = 26, PAD_R = 2, PAD_T = 4, PAD_B = 18;
  const plotW = Math.max(0, width - PAD_L - PAD_R);
  const plotH = H - PAD_T - PAD_B;

  const x = (i: number) => PAD_L + (plotW * i) / (data.length - 1);
  const y = (v: number) => PAD_T + plotH * (1 - v / max);
  const pts = data.map((d, i) => ({ x: x(i), y: y(d.v) }));

  return (
    <div ref={box} style={{ height: H }}>
      {plotW > 0 && (
        <svg width={width} height={H} aria-hidden="true">
          {[0, max / 2, max].map(t => (
            <text key={t} x={PAD_L - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="#9ca3af">
              {Math.round(t)}
            </text>
          ))}
          {data.map((d, i) => (
            <text key={d.h} x={x(i)} y={H - 5} textAnchor="middle" fontSize="9" fill="#9ca3af">
              {d.h}
            </text>
          ))}
          <path d={monotonePath(pts)} fill="none" stroke="#2d6aad" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}

// ── DERIVED VIEWS ─────────────────────────────────────────────────────────────

/** A hull joined to whatever the current run says about it. */
interface Row {
  vessel: Vessel;
  run: VesselRun | null;
  status: StageStatus;
}

function buildRows(p: Projection): Row[] {
  return FLEET.map(vessel => {
    const run = p.vessels.find(v => v.vesselId === vessel.id) ?? null;
    return { vessel, run, status: run?.overallStatus ?? "pending" };
  });
}

/** Agent events bucketed into the last seven hours, for the sparkline. */
function eventsPerHour(events: AgentEvent[]): { h: string; v: number }[] {
  const now = new Date();
  const buckets: { h: string; v: number }[] = [];

  for (let back = 6; back >= 0; back--) {
    const slot = new Date(now.getTime() - back * 3_600_000);
    const label = String(slot.getUTCHours()).padStart(2, "0");
    const v = events.filter(e => {
      const at = new Date(e.at);
      return at.getUTCHours() === slot.getUTCHours()
        && at.getUTCDate() === slot.getUTCDate();
    }).length;
    buckets.push({ h: label, v });
  }

  return buckets;
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────

function Sidebar({ active, onNav, rows }: { active: string; onNav: (id: string) => void; rows: Row[] }) {
  const [search, setSearch] = useState("");
  const filtered = search ? rows.filter(r => r.vessel.name.toLowerCase().includes(search.toLowerCase())) : rows;

  return (
    <aside className="w-[220px] flex-shrink-0 border-r border-[#e2e4e9] bg-white flex flex-col h-full">
      <div className="px-2 pt-2 pb-1 flex-shrink-0">
        <button
          onClick={() => onNav("dashboard")}
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-[12px] transition-colors ${
            active === "dashboard" ? "bg-[#eef3fa] text-[#2d6aad] font-medium" : "text-[#656d78] hover:text-[#0d1117] hover:bg-[#f5f6f8]"
          }`}
        >
          <BarChart2 size={13} /> Fleet Overview
        </button>
      </div>

      <div className="px-2 pb-1.5 flex-shrink-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#e2e4e9]">
          <Search size={11} className="text-[#9ca3af] flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter vessels…"
            className="flex-1 text-[11px] bg-transparent outline-none text-[#0d1117] placeholder-[#9ca3af]" />
        </div>
      </div>

      <div className="px-4 pb-1 flex-shrink-0">
        <span className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest">Vessels ({filtered.length})</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        {filtered.map(({ vessel, status }) => {
          const isActive = active === vessel.id;
          const dot = status === "complete" ? "bg-emerald-500" : status === "active" ? "bg-[#2d6aad]" : status === "needs-review" ? "bg-amber-500" : "bg-gray-300";
          return (
            <button key={vessel.id} onClick={() => onNav(vessel.id)}
              className={`w-full flex items-center gap-2 px-3 py-[5px] rounded text-left transition-colors ${
                isActive ? "bg-[#eef3fa] text-[#0d1117]" : "text-[#656d78] hover:text-[#0d1117] hover:bg-[#f5f6f8]"
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
              <span className={`text-[12px] truncate flex-1 ${isActive ? "font-medium" : ""}`}>{vessel.name}</span>
            </button>
          );
        })}
      </nav>

      {/*
        The role, never a name. Stage 6 is a real human decision in this product
        and the account row is where that person is represented — inventing one
        would be putting words in a stranger's mouth. The avatar is Clerk's
        UserButton so sign-out is reachable from the only chrome the demo has.
      */}
      <div className="px-3 py-2.5 border-t border-[#e2e4e9] flex-shrink-0 flex items-center gap-2.5">
        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
          <AccountButton size={24} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-[#0d1117] truncate">Designated Person Ashore</div>
          <div className="text-[10px] text-[#9ca3af]">{OPERATOR}</div>
        </div>
      </div>
    </aside>
  );
}

// ── TOP BAR ───────────────────────────────────────────────────────────────────

interface RunState {
  busy: boolean;
  label: string;
  error: string | null;
}

function TopBar({
  title, subtitle, onBack, showBack, onNav, rows, projection, overlay, dispatch, runState, onRunAll,
}: {
  title: string; subtitle?: string; onBack?: () => void; showBack?: boolean;
  onNav?: (id: string) => void;
  rows: Row[];
  projection: Projection;
  overlay: Overlay;
  dispatch: React.Dispatch<import("./state").Action>;
  runState: RunState;
  onRunAll: () => void;
}) {
  const [searchOpen, setSearchOpen]     = useState(false);
  const [notifOpen, setNotifOpen]       = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");

  // Undefined when auth isn't configured, in which case the Account block falls
  // back to the operator rather than showing an empty line.
  const { user } = useUser();
  const accountEmail = user?.primaryEmailAddress?.emailAddress;

  const q = searchQuery.toLowerCase();
  const searchResults = q.length > 0
    ? rows.filter(r =>
        r.vessel.name.toLowerCase().includes(q)
        || r.vessel.route.toLowerCase().includes(q)
        || r.vessel.flag.toLowerCase().includes(q)
        || r.vessel.type.toLowerCase().includes(q))
    : [];

  // Notifications are the agent event log, filtered by what the operator asked
  // to be told about. The settings toggles below genuinely drive this.
  const notifications = useMemo(() => {
    const read = new Set(overlay.readEvents);
    return projection.events
      .filter(e => {
        if (e.stage === "Approval" && !overlay.settings.dpaEmail) return false;
        if (e.type === "warning" && !overlay.settings.agentAlerts) return false;
        return true;
      })
      .slice(0, 8)
      .map(e => ({ event: e, key: eventKey(e), unread: !read.has(eventKey(e)) }));
  }, [projection.events, overlay.readEvents, overlay.settings]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const lastRun = projection.completedAt
    ? new Date(projection.completedAt).toISOString().slice(11, 16) + " UTC"
    : "never";

  return (
    <>
      <header className="h-11 border-b border-[#e2e4e9] bg-white flex items-center px-5 gap-3 flex-shrink-0 relative z-20">
        {showBack && (
          <>
            <button onClick={onBack} className="flex items-center gap-1 text-[11px] text-[#656d78] hover:text-[#0d1117] transition-colors">
              <ArrowLeft size={12} /> Back
            </button>
            <span className="text-[#d0d3d9]">/</span>
          </>
        )}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[#0d1117] truncate">{title}</span>
          {subtitle && <span className="text-[11px] text-[#9ca3af] truncate hidden md:block">{subtitle}</span>}
        </div>
        {/*
          The standing disclosure. The fleet is invented, the evidence the agents
          generate is synthetic, and none of this is compliance advice — which is
          worth saying in the chrome rather than burying in a terms page.
        */}
        <span
          className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] border border-[#e2e4e9] rounded px-1.5 py-[2px] flex-shrink-0"
          title="Invented fleet. Regulatory summaries, not regulatory text. Agent-generated evidence is synthetic. Not legal, class or flag-state advice."
        >
          Demo data
        </span>

        {/* The run trigger. Same markup the decorative "Agent running" indicator
            used, now a button that actually starts the agents. */}
        <button
          onClick={onRunAll}
          disabled={runState.busy}
          title={runState.error ?? "Run all five agents across the fleet"}
          className="flex items-center gap-1.5 pr-3 border-r border-[#e2e4e9] hover:opacity-70 transition-opacity disabled:cursor-wait"
        >
          <span className="relative flex h-[7px] w-[7px]">
            {runState.busy && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2d6aad] opacity-30" />}
            <span className={`relative inline-flex rounded-full h-[7px] w-[7px] ${runState.error ? "bg-amber-500" : runState.busy ? "bg-[#2d6aad]" : "bg-[#c8cbd0]"}`} />
          </span>
          <span className="text-[10px] text-[#9ca3af] font-medium">
            {runState.busy ? runState.label : runState.error ? "Run failed" : "Run agents"}
          </span>
        </button>

        <div className="flex items-center gap-0.5">
          <button onClick={() => { setSearchOpen(true); setNotifOpen(false); setSettingsOpen(false); }}
            className="w-7 h-7 flex items-center justify-center text-[#9ca3af] hover:text-[#0d1117] hover:bg-[#f5f6f8] rounded transition-colors">
            <Search size={13} />
          </button>
          <button onClick={() => { setNotifOpen(o => !o); setSettingsOpen(false); }}
            className={`w-7 h-7 flex items-center justify-center rounded relative transition-colors ${notifOpen ? "text-[#0d1117] bg-[#f5f6f8]" : "text-[#9ca3af] hover:text-[#0d1117] hover:bg-[#f5f6f8]"}`}>
            <Bell size={13} />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-[5px] h-[5px] bg-[#2d6aad] rounded-full" />}
          </button>
          <button onClick={() => { setSettingsOpen(o => !o); setNotifOpen(false); }}
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${settingsOpen ? "text-[#0d1117] bg-[#f5f6f8]" : "text-[#9ca3af] hover:text-[#0d1117] hover:bg-[#f5f6f8]"}`}>
            <Settings size={13} />
          </button>
        </div>

        {notifOpen && (
          <div className="absolute top-11 right-0 w-[380px] bg-white border border-[#e2e4e9] rounded-lg shadow-lg overflow-hidden z-30">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e2e4e9]">
              <span className="text-[12px] font-semibold text-[#0d1117]">Notifications</span>
              {unreadCount > 0 && <span className="text-[10px] font-medium text-[#2d6aad]">{unreadCount} unread</span>}
            </div>
            <div className="divide-y divide-[#e2e4e9] max-h-80 overflow-y-auto">
              {notifications.length === 0 && (
                <div className="px-4 py-8 text-center text-[11px] text-[#9ca3af]">
                  Nothing yet. Run the agents to generate events.
                </div>
              )}
              {notifications.map(({ event, key, unread }) => {
                const dot = event.type === "success" ? "bg-emerald-500" : event.type === "warning" ? "bg-amber-500" : "bg-[#2d6aad]";
                return (
                  <button key={key}
                    onClick={() => {
                      if (event.vesselId) onNav?.(event.vesselId);
                      dispatch({ type: "markAllRead", keys: [key] });
                      setNotifOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-[#f8f9fa] cursor-pointer ${unread ? "bg-[#fafbfc]" : ""}`}>
                    <div className="flex items-start gap-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[5px] ${dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-[11px] font-medium text-[#2d6aad]">{event.vesselName}</span>
                          <span className="text-[10px] text-[#9ca3af] flex-shrink-0">{new Date(event.at).toISOString().slice(11, 16)}</span>
                        </div>
                        <p className="text-[11px] text-[#374151] leading-relaxed">{event.message}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="px-4 py-2 border-t border-[#e2e4e9]">
              <button
                onClick={() => dispatch({ type: "markAllRead", keys: notifications.map(n => n.key) })}
                className="text-[11px] text-[#2d6aad] hover:underline">
                Mark all as read
              </button>
            </div>
          </div>
        )}

        {settingsOpen && (
          <div className="absolute top-11 right-0 w-72 bg-white border border-[#e2e4e9] rounded-lg shadow-lg overflow-hidden z-30">
            <div className="px-4 py-2.5 border-b border-[#e2e4e9]">
              <span className="text-[12px] font-semibold text-[#0d1117]">Settings</span>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">Account</div>
                <div className="flex items-center gap-2.5 p-2.5 bg-[#f8f9fa] rounded border border-[#e2e4e9]">
                  <div className="w-7 h-7 rounded-full bg-[#2d6aad] flex items-center justify-center text-white flex-shrink-0">
                    <UserCheck size={13} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-medium text-[#0d1117]">Designated Person Ashore</div>
                    <div className="text-[10px] text-[#9ca3af] truncate">{accountEmail ?? OPERATOR}</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">Notifications</div>
                <div className="space-y-2.5">
                  {([
                    { key: "dpaEmail"    as const, label: "DPA approval requests", sub: "Show items reaching your queue" },
                    { key: "agentAlerts" as const, label: "Agent alerts",          sub: "Show evidence failures and blockers" },
                    { key: "persist"     as const, label: "Persist this session",  sub: "Keep your changes across a reload" },
                  ]).map(({ key, label, sub }) => {
                    const val = key === "persist" ? overlay.settings.weeklyReport : overlay.settings[key];
                    return (
                      <div key={key} className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[11px] text-[#0d1117]">{label}</div>
                          <div className="text-[10px] text-[#9ca3af]">{sub}</div>
                        </div>
                        <button
                          onClick={() => dispatch({
                            type: "settings",
                            patch: key === "persist" ? { weeklyReport: !val } : { [key]: !val },
                          })}
                          className={`relative rounded-full flex-shrink-0 transition-colors ${val ? "bg-[#2d6aad]" : "bg-[#d1d5db]"}`}
                          style={{ width: 30, height: 17 }}>
                          <span className={`absolute top-[2px] w-[13px] h-[13px] bg-white rounded-full shadow-sm transition-transform ${val ? "translate-x-[15px]" : "translate-x-[2px]"}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">Agent</div>
                <div className="space-y-1.5">
                  {[
                    ["Runs", "On demand"],
                    ["Corpus version", CORPUS_VERSION],
                    ["Records indexed", String(CORPUS.length)],
                    ["Current through", CURRENT_THROUGH],
                    ["Last run", lastRun],
                    ["Model", projection.model ?? "not yet run"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <span className="text-[11px] text-[#656d78] flex-shrink-0">{k}</span>
                      <span className="text-[11px] font-medium text-[#0d1117] truncate">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-1 border-t border-[#e2e4e9]">
                <button
                  onClick={() => { dispatch({ type: "reset" }); setSettingsOpen(false); }}
                  className="text-[11px] text-[#2d6aad] hover:underline">
                  Reset this session
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative w-full max-w-[520px] bg-white rounded-lg shadow-xl border border-[#e2e4e9] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e2e4e9]">
              <Search size={13} className="text-[#9ca3af] flex-shrink-0" />
              <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search vessels, routes, flags…"
                className="flex-1 text-[13px] text-[#0d1117] placeholder-[#9ca3af] outline-none" />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                className="text-[10px] text-[#9ca3af] border border-[#e2e4e9] rounded px-1.5 py-0.5 hover:bg-[#f5f6f8]">Esc</button>
            </div>
            {searchQuery.length === 0 && (
              <div className="px-4 py-3">
                <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">Needs attention</div>
                {rows.filter(r => r.status !== "complete").slice(0, 5).map(({ vessel, status }) => (
                  <button key={vessel.id} onClick={() => { onNav?.(vessel.id); setSearchOpen(false); setSearchQuery(""); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-[#f5f6f8] transition-colors text-left">
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-medium text-[#0d1117]">{vessel.name}</span>
                      <span className="text-[11px] text-[#9ca3af] ml-2">{vessel.gt.toLocaleString()} GT · {vessel.flag}</span>
                    </div>
                    <StatusChip status={status} />
                  </button>
                ))}
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="max-h-72 overflow-y-auto divide-y divide-[#e2e4e9]">
                {searchResults.map(({ vessel, status }) => (
                  <button key={vessel.id} onClick={() => { onNav?.(vessel.id); setSearchOpen(false); setSearchQuery(""); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8f9fa] transition-colors text-left">
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-[#0d1117]">{vessel.name}</div>
                      <div className="text-[10px] text-[#9ca3af]">{vessel.route} · {vessel.flag}</div>
                    </div>
                    <StatusChip status={status} />
                  </button>
                ))}
              </div>
            )}
            {searchQuery.length > 0 && searchResults.length === 0 && (
              <div className="px-4 py-8 text-center text-[12px] text-[#9ca3af]">No vessels matching "{searchQuery}"</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

function Dashboard({ onNav, rows, projection, runState }: {
  onNav: (id: string) => void;
  rows: Row[];
  projection: Projection;
  runState: RunState;
}) {
  const [showAll, setShowAll] = useState(false);

  const complete    = rows.filter(r => r.status === "complete").length;
  const active      = rows.filter(r => r.status === "active").length;
  const needsReview = rows.filter(r => r.status === "needs-review").length;
  const total       = rows.length;

  const actionsInFlight = rows.reduce(
    (sum, r) => sum + (r.run?.actions.filter(a => a.status !== "done").length ?? 0), 0);

  const spark = eventsPerHour(projection.events);
  const sparkMax = Math.max(4, ...spark.map(s => s.v));

  const visible = showAll ? rows : rows.slice(0, 14);
  const hasRun = rows.some(r => r.run !== null);

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {/* KPI strip */}
      <div className="flex items-stretch border-b border-[#e2e4e9] divide-x divide-[#e2e4e9]">
        {[
          { label: "Vessels reviewed",    value: `${complete} / ${total}`,        highlight: true  },
          { label: "Records indexed",     value: CORPUS.length.toLocaleString(),  highlight: false },
          { label: "Actions in flight",   value: actionsInFlight.toLocaleString(), highlight: false },
          { label: "Needs review",        value: String(needsReview),             highlight: false },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="flex flex-col justify-center px-6 py-3 flex-1">
            <div className="text-[10px] text-[#9ca3af] font-medium uppercase tracking-wider mb-0.5">{label}</div>
            <div className={`text-[20px] font-bold tabular-nums leading-tight ${highlight ? "text-[#2d6aad]" : "text-[#0d1117]"}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-5 space-y-5">
        {!hasRun && (
          <div className="border border-[#e2e4e9] rounded-lg px-5 py-4 bg-[#fafbfc]">
            <div className="text-[12px] font-medium text-[#0d1117] mb-1">No agent run yet</div>
            <p className="text-[11px] text-[#656d78] leading-relaxed">
              {runState.error
                ? runState.error
                : `The corpus is indexed and ${CORPUS.length} records are ready. Press "Run agents" in the top bar to scan the corpus, extract obligations for all ${total} hulls, generate actions, and validate evidence.`}
            </p>
          </div>
        )}

        <div className="grid grid-cols-5 gap-5">
          {/* Fleet table */}
          <div className="col-span-3">
            <h2 className="text-[11px] font-semibold text-[#656d78] uppercase tracking-wider mb-2">{OPERATOR} — {total} vessels</h2>
            <div className="border border-[#e2e4e9] rounded-lg overflow-hidden">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#e2e4e9]">
                    <th className="text-left px-4 py-2 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider font-normal">Vessel</th>
                    <th className="text-left px-3 py-2 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider font-normal">Flag</th>
                    <th className="text-right px-3 py-2 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider font-normal">GT</th>
                    <th className="px-3 py-2 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider font-normal">Stages</th>
                    <th className="px-4 py-2 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider font-normal">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e4e9]">
                  {visible.map(({ vessel, run, status }) => (
                    <tr key={vessel.id} onClick={() => onNav(vessel.id)} className="hover:bg-[#f8f9fa] cursor-pointer transition-colors">
                      <td className="px-4 py-2.5 font-medium text-[#0d1117] hover:text-[#2d6aad]">{vessel.name}</td>
                      <td className="px-3 py-2.5 text-[#656d78]">{vessel.flag}</td>
                      <td className="px-3 py-2.5 text-right text-[#656d78] tabular-nums font-mono text-[11px]">
                        {vessel.gt.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5">
                        {run
                          ? <StagePips stages={run.stages} />
                          : <span className="text-[10px] text-[#c8cbd0]">not run</span>}
                      </td>
                      <td className="px-4 py-2.5"><StatusChip status={status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {total > 14 && (
                <div className="px-4 py-2 border-t border-[#e2e4e9] bg-[#f8f9fa]">
                  <button onClick={() => setShowAll(v => !v)} className="text-[11px] text-[#2d6aad] hover:underline">
                    {showAll ? "Show fewer" : `View all ${total} vessels →`}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="col-span-2 space-y-5">
            <div>
              <h2 className="text-[11px] font-semibold text-[#656d78] uppercase tracking-wider mb-2">Agent events / hr</h2>
              <div className="border border-[#e2e4e9] rounded-lg p-4 bg-white">
                <Sparkline data={spark} max={sparkMax} />
              </div>
            </div>

            <div>
              <h2 className="text-[11px] font-semibold text-[#656d78] uppercase tracking-wider mb-2">Fleet compliance status</h2>
              <div className="border border-[#e2e4e9] rounded-lg overflow-hidden">
                {[
                  { label: "Complete",     count: complete,    color: "bg-emerald-500", pct: complete    / total },
                  { label: "In Progress",  count: active,      color: "bg-[#2d6aad]",   pct: active      / total },
                  { label: "Needs Review", count: needsReview, color: "bg-amber-500",   pct: needsReview / total },
                ].map(({ label, count, color, pct }, i, arr) => (
                  <div key={label} className={`px-4 py-3 ${i < arr.length - 1 ? "border-b border-[#e2e4e9]" : ""}`}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[11px] text-[#656d78]">{label}</span>
                      <span className="text-[11px] font-semibold text-[#0d1117] tabular-nums">{count}</span>
                    </div>
                    <div className="h-[3px] rounded-full bg-[#f0f2f5] overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-[11px] font-semibold text-[#656d78] uppercase tracking-wider mb-2">Pipeline stage breakdown</h2>
              <div className="border border-[#e2e4e9] rounded-lg overflow-hidden">
                {ST.map((stage, i) => {
                  const Icon = stage.icon;
                  const doneCount = rows.filter(r => r.run?.stages[stage.id - 1]?.status === "complete").length;
                  return (
                    <div key={stage.id} className={`flex items-center gap-3 px-4 py-2.5 ${i < ST.length - 1 ? "border-b border-[#e2e4e9]" : ""}`}>
                      <span className="text-[10px] font-mono text-[#c8cbd0] w-4 flex-shrink-0">{stage.id}</span>
                      <Icon size={11} className="text-[#9ca3af] flex-shrink-0" />
                      <span className="text-[11px] text-[#656d78] flex-1">{STAGE_LABELS[stage.id].short}</span>
                      <div className="h-[3px] w-20 bg-[#f0f2f5] rounded-full overflow-hidden flex-shrink-0">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(doneCount / total) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-[#9ca3af] tabular-nums w-12 text-right flex-shrink-0">{doneCount}/{total}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Agent event log */}
        <div>
          <h2 className="text-[11px] font-semibold text-[#656d78] uppercase tracking-wider mb-2">Agent event log</h2>
          <div className="border border-[#e2e4e9] rounded-lg overflow-hidden">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-[#e2e4e9]">
                  <th className="text-left px-4 py-2 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider font-normal w-16">Time</th>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider font-normal w-32">Vessel</th>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider font-normal w-24">Stage</th>
                  <th className="text-left px-4 py-2 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider font-normal">Event</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e4e9]">
                {projection.events.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-[#9ca3af]">No events yet.</td></tr>
                )}
                {projection.events.slice(0, 12).map(entry => {
                  const dot = entry.type === "success" ? "bg-emerald-500" : entry.type === "warning" ? "bg-amber-500" : "bg-[#2d6aad]";
                  return (
                    <tr key={eventKey(entry)}
                      onClick={() => entry.vesselId && onNav(entry.vesselId)}
                      className="hover:bg-[#f8f9fa] transition-colors cursor-pointer">
                      <td className="px-4 py-2.5 font-mono text-[#9ca3af]">{new Date(entry.at).toISOString().slice(11, 16)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                          <span className="font-medium text-[#0d1117] truncate">{entry.vesselName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[#656d78]">{entry.stage}</td>
                      <td className="px-4 py-2.5 text-[#374151]">{entry.message}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── VESSEL PAGE ───────────────────────────────────────────────────────────────

function VesselPage({ row, dispatch, onRunVessel, runState, getToken }: {
  row: Row;
  dispatch: React.Dispatch<import("./state").Action>;
  onRunVessel: (v: Vessel) => void;
  runState: RunState;
  getToken: () => Promise<string | null>;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  // Which action the evidence uploader is pointed at. Lives here rather than in
  // StageDetail because stage 4 sets it and stage 5 reads it: filing the
  // document is Evidence Collection's job, so stage 4 hands off instead of
  // growing an uploader of its own.
  const [filingAgainst, setFilingAgainst] = useState<string | null>(null);
  const { vessel, run } = row;

  const fileEvidenceFor = useCallback((actionId: string) => {
    setFilingAgainst(actionId);
    setExpanded(5);
  }, []);

  const stages = run?.stages ?? ST.map(s => ({
    id: s.id as 1 | 2 | 3 | 4 | 5 | 6,
    status: "pending" as StageStatus,
    summary: "This hull has not been through an agent run yet.",
    count: 0,
    countLabel: "—",
  }));

  const stagesComplete = stages.filter(s => s.status === "complete").length;
  const currentStageIdx = stages.findIndex(s => s.status === "active" || s.status === "needs-review");

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="border-b border-[#e2e4e9] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-start gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[15px] font-semibold text-[#0d1117]">{vessel.name}</h1>
              <StatusChip status={row.status} />
              <button
                onClick={() => onRunVessel(vessel)}
                disabled={runState.busy}
                className="flex items-center gap-1 text-[10px] text-[#656d78] hover:text-[#2d6aad] transition-colors disabled:opacity-40 disabled:cursor-wait">
                <RotateCw size={11} /> {runState.busy ? "running…" : "Re-run this hull"}
              </button>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#9ca3af] flex-wrap">
              <span>{typeLabel(vessel)}</span>
              <span>·</span>
              <span>IMO <span className="text-[#656d78] font-mono">{vessel.imo}</span></span>
              <span>·</span>
              <span>Flag: <span className="text-[#656d78]">{vessel.flag}</span></span>
              <span>·</span>
              <span>Built: <span className="text-[#656d78]">{vessel.built}</span></span>
              <span>·</span>
              <span>{vessel.gt.toLocaleString()} GT</span>
              <span>·</span>
              <span>Route: <span className="text-[#656d78]">{vessel.route}</span></span>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-[11px] text-[#9ca3af] mb-2">Compliance stages</div>
            <div className="flex items-end gap-1">
              {stages.map(s => {
                const h = s.status === "complete" ? "h-5" : s.status === "active" ? "h-3.5" : s.status === "needs-review" ? "h-3" : "h-2";
                const c = s.status === "complete" ? "bg-emerald-500" : s.status === "active" ? "bg-[#2d6aad]" : s.status === "needs-review" ? "bg-amber-500" : "bg-[#e2e4e9]";
                return <div key={s.id} className={`w-5 ${h} ${c} rounded-sm`} />;
              })}
            </div>
            <div className="text-[10px] text-[#9ca3af] mt-1">{stagesComplete} of 6 complete</div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-5">
        <h2 className="text-[11px] font-semibold text-[#656d78] uppercase tracking-wider mb-3">Compliance pipeline</h2>
        <div className="border border-[#e2e4e9] rounded-lg overflow-hidden divide-y divide-[#e2e4e9]">
          {stages.map((stage, i) => {
            const Icon = ST[stage.id - 1].icon;
            const isOpen    = expanded === stage.id;
            const isCurrent = i === currentStageIdx;
            const iconColor = stage.status === "complete" ? "text-emerald-600" : stage.status === "active" ? "text-[#2d6aad]" : stage.status === "needs-review" ? "text-amber-600" : "text-[#9ca3af]";
            return (
              <div key={stage.id} className={`bg-white border-l-2 ${isCurrent ? "border-l-[#2d6aad]" : "border-l-transparent"}`}>
                <button onClick={() => setExpanded(isOpen ? null : stage.id)}
                  className="w-full flex items-center gap-4 px-5 py-3 hover:bg-[#f8f9fa] transition-colors text-left">
                  <span className="text-[11px] font-mono text-[#c8cbd0] w-4 flex-shrink-0 text-right">{String(stage.id).padStart(2, "0")}</span>
                  <Icon size={13} className={`flex-shrink-0 ${iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-[#0d1117]">{STAGE_LABELS[stage.id].label}</div>
                    <div className="text-[11px] text-[#9ca3af] truncate mt-0.5">{stage.summary}</div>
                  </div>
                  <div className="text-right flex-shrink-0 mr-4">
                    <div className="text-[13px] font-semibold text-[#0d1117] tabular-nums">{stage.count.toLocaleString()}</div>
                    <div className="text-[10px] text-[#9ca3af]">{stage.countLabel}</div>
                  </div>
                  <StatusChip status={stage.status} />
                  <ChevronRight size={13} className={`text-[#c8cbd0] flex-shrink-0 ml-1 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                </button>
                {isOpen && (
                  <div className="border-t border-[#e2e4e9] px-5 py-4 bg-[#fafbfc]">
                    <StageDetail
                      stageId={stage.id}
                      vessel={vessel}
                      run={run}
                      dispatch={dispatch}
                      getToken={getToken}
                      filingAgainst={filingAgainst}
                      setFilingAgainst={setFilingAgainst}
                      onFileEvidence={fileEvidenceFor}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── STAGE DETAIL ──────────────────────────────────────────────────────────────

const MicroTable = ({ children }: { children: React.ReactNode }) => (
  <div className="border border-[#e2e4e9] rounded-lg overflow-hidden bg-white">
    <table className="w-full text-[11px] border-collapse">{children}</table>
  </div>
);

const THead = ({ cols }: { cols: string[] }) => (
  <thead>
    <tr className="bg-[#f8f9fa] border-b border-[#e2e4e9]">
      {cols.map(c => <th key={c} className="text-left px-4 py-2 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider font-normal">{c}</th>)}
    </tr>
  </thead>
);

const NotRun = () => (
  <p className="text-[11px] text-[#9ca3af] leading-relaxed">
    Nothing here yet. Run the agents to populate this stage.
  </p>
);

function StageDetail({ stageId, vessel, run, dispatch, getToken, filingAgainst, setFilingAgainst, onFileEvidence }: {
  stageId: number;
  vessel: Vessel;
  run: VesselRun | null;
  dispatch: React.Dispatch<import("./state").Action>;
  getToken: () => Promise<string | null>;
  filingAgainst: string | null;
  setFilingAgainst: (id: string | null) => void;
  /** Jump to Evidence Collection with the uploader bound to this action. */
  onFileEvidence: (actionId: string) => void;
}) {
  const [viewing, setViewing] = useState<EvidenceItem | null>(null);
  const [returning, setReturning] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const records = useMemo(() => applicableRecords(vessel), [vessel]);

  // ── Stage 1: what the corpus holds for this hull ────────────────────────────
  if (stageId === 1) {
    const byInstrument = new Map<string, number>();
    for (const r of records) byInstrument.set(r.instrument, (byInstrument.get(r.instrument) ?? 0) + 1);

    return (
      <div className="space-y-3">
        <p className="text-[11px] text-[#656d78] leading-relaxed">
          {CORPUS.length} records indexed across {new Set(CORPUS.map(r => r.instrument)).size} instruments,
          reviewed against published sources through {CURRENT_THROUGH}.{" "}
          <strong className="text-[#0d1117] font-medium">{records.length}</strong> apply to{" "}
          <strong className="text-[#0d1117] font-medium">{vessel.name}</strong> on flag, type, tonnage, fuel and trading area.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Applicable records", String(records.length)],
            ["Corpus version", CORPUS_VERSION],
            ["Trading area", vessel.tradingArea],
          ].map(([label, value]) => (
            <div key={label} className="border border-[#e2e4e9] rounded p-3 bg-white">
              <div className="text-[10px] text-[#9ca3af] mb-1">{label}</div>
              <div className="text-[12px] font-semibold text-[#0d1117]">{value}</div>
            </div>
          ))}
        </div>
        <MicroTable>
          <THead cols={["Instrument", "Records"]} />
          <tbody className="divide-y divide-[#e2e4e9]">
            {[...byInstrument.entries()].sort().map(([instrument, n]) => (
              <tr key={instrument} className="hover:bg-[#f8f9fa]">
                <td className="px-4 py-2 text-[#0d1117]">
                  <div className="flex items-center gap-2"><CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />{instrument}</div>
                </td>
                <td className="px-4 py-2 text-[#9ca3af] font-mono">{n}</td>
              </tr>
            ))}
          </tbody>
        </MicroTable>
      </div>
    );
  }

  if (!run) return <NotRun />;

  // ── Stage 2: extracted obligations, each traced to a record ────────────────
  if (stageId === 2) {
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-[#656d78] leading-relaxed">
          <strong className="text-[#0d1117] font-medium">{run.requirements.length} discrete obligations</strong> extracted.
          Every one cites the corpus record it came from; any citation that did not resolve was dropped before it reached this table.
        </p>
        <MicroTable>
          <THead cols={["ID", "Obligation", "Source", "Category"]} />
          <tbody className="divide-y divide-[#e2e4e9]">
            {run.requirements.map((r: Requirement) => {
              const rec = CORPUS_BY_ID[r.sourceId];
              return (
                <tr key={r.id} className="hover:bg-[#f8f9fa]">
                  <td className="px-4 py-2 font-mono text-[#9ca3af]">{r.id}</td>
                  <td className="px-4 py-2 text-[#0d1117]">{r.obligation}</td>
                  <td className="px-4 py-2 text-[#656d78]" title={rec ? `${rec.instrument} — ${rec.reference}` : undefined}>
                    {rec ? rec.reference : r.sourceId}
                  </td>
                  <td className="px-4 py-2 text-[#656d78]">{r.category}</td>
                </tr>
              );
            })}
          </tbody>
        </MicroTable>
      </div>
    );
  }

  // ── Stage 3: why this hull draws this set ──────────────────────────────────
  if (stageId === 3) {
    const differentiating = records.filter(r => Object.keys(r.applicability).length > 0);
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-[#656d78] leading-relaxed">{run.stages[2].summary}</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Vessel type", vessel.type],
            ["Flag state", vessel.flag],
            ["Fuel", vessel.fuel],
            ["Requirements assigned", String(run.requirements.length)],
          ].map(([label, value]) => (
            <div key={label} className="border border-[#e2e4e9] rounded p-3 bg-white">
              <div className="text-[10px] text-[#9ca3af] mb-1">{label}</div>
              <div className="text-[12px] font-semibold text-[#0d1117]">{value}</div>
            </div>
          ))}
        </div>
        <MicroTable>
          <THead cols={["Conditional instrument", "Why it applies here"]} />
          <tbody className="divide-y divide-[#e2e4e9]">
            {differentiating.map(r => (
              <tr key={r.id} className="hover:bg-[#f8f9fa]">
                <td className="px-4 py-2 text-[#0d1117]">{r.title}</td>
                <td className="px-4 py-2 text-[#656d78]">
                  {[
                    r.applicability.vesselTypes && `type is ${vessel.type}`,
                    r.applicability.fuelTypes && `fuel is ${vessel.fuel}`,
                    r.applicability.minGrossTonnage && `${vessel.gt.toLocaleString()} GT ≥ ${r.applicability.minGrossTonnage.toLocaleString()}`,
                    r.applicability.builtBefore && `built ${vessel.built}, before ${r.applicability.builtBefore}`,
                    r.applicability.builtFrom && `built ${vessel.built}, from ${r.applicability.builtFrom}`,
                    r.applicability.tradingAreas && `trades ${vessel.tradingArea}`,
                  ].filter(Boolean).join("; ")}
                </td>
              </tr>
            ))}
          </tbody>
        </MicroTable>
      </div>
    );
  }

  // ── Stage 4: dated work ────────────────────────────────────────────────────
  if (stageId === 4) {
    const sc: Record<string, string> = { done: "text-emerald-700", "in-progress": "text-[#2d6aad]", overdue: "text-red-600" };
    const sl: Record<string, string> = { done: "Done", "in-progress": "In progress", overdue: "Overdue" };
    const overdue = run.actions.filter((a: ComplianceAction) => a.status === "overdue");
    const done = run.actions.filter((a: ComplianceAction) => a.status === "done").length;

    return (
      <div className="space-y-3">
        <p className="text-[11px] text-[#656d78] leading-relaxed">
          <strong className="text-[#0d1117] font-medium">{run.actions.length} compliance actions</strong> generated — each linked to an obligation, with a due date derived from that obligation&apos;s cadence and the kind of document that discharges it.
        </p>

        <div className="border border-[#e2e4e9] rounded-lg px-4 py-2.5 bg-white flex items-center gap-6 text-[10px] text-[#656d78] flex-wrap">
          <span><span className="font-medium text-emerald-700">Done</span> — accepted evidence exists ({done})</span>
          <span><span className="font-medium text-[#2d6aad]">In progress</span> — outstanding, not yet due ({run.actions.length - done - overdue.length})</span>
          <span><span className="font-medium text-red-600">Overdue</span> — due date passed, nothing accepted ({overdue.length})</span>
        </div>

        {overdue.length > 0 && (
          <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-900">
              <AlertTriangle size={12} className="text-amber-600 flex-shrink-0" />
              {overdue.length === 1 ? "1 action is past its due date" : `${overdue.length} actions are past their due date`}
            </div>
            <p className="text-[10px] text-amber-800 leading-relaxed">
              This is what the amber flag on this stage is pointing at. Collecting the document is Evidence
              Collection&apos;s job — open it against this action and file one there.
            </p>
            {overdue.map((a: ComplianceAction) => (
              <div key={a.id} className="flex items-start gap-3 text-[11px]">
                <span className="font-mono text-amber-700 flex-shrink-0">{a.id}</span>
                <span className="text-[#374151] flex-1 min-w-0">{a.action}</span>
                <span className="font-mono text-red-600 flex-shrink-0">due {a.due}</span>
                <button
                  onClick={() => onFileEvidence(a.id)}
                  className="px-2 py-1 rounded bg-amber-600 text-white text-[10px] font-medium hover:bg-amber-700 transition-colors flex items-center gap-1 flex-shrink-0">
                  Open in stage 05 <ChevronRight size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        <MicroTable>
          <THead cols={["ID", "Action", "Due", "Status", ""]} />
          <tbody className="divide-y divide-[#e2e4e9]">
            {run.actions.map((a: ComplianceAction) => (
              <tr key={a.id} className="hover:bg-[#f8f9fa]">
                <td className="px-4 py-2 font-mono text-[#9ca3af] whitespace-nowrap">{a.id}</td>
                <td className="px-4 py-2 text-[#0d1117]">{a.action}</td>
                <td className="px-4 py-2 font-mono text-[#656d78] whitespace-nowrap">{a.due}</td>
                <td className={`px-4 py-2 font-medium whitespace-nowrap ${sc[a.status]}`}>{sl[a.status]}</td>
                <td className="pr-4 py-2 text-right">
                  {a.status !== "done" && (
                    <button
                      onClick={() => onFileEvidence(a.id)}
                      title="File evidence against this action in Evidence Collection"
                      className="text-[#c8cbd0] hover:text-[#2d6aad] transition-colors">
                      <ChevronRight size={12} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </MicroTable>
      </div>
    );
  }

  // ── Stage 5: evidence, and a real upload path ──────────────────────────────
  if (stageId === 5) {
    const sc: Record<string, string> = { accepted: "text-emerald-700", rejected: "text-red-600", pending: "text-amber-700" };
    const ti: Record<string, React.ReactNode> = {
      Certificate: <FileText size={11} className="text-[#9ca3af]" />,
      "Record book": <FileText size={11} className="text-[#9ca3af]" />,
      "Drill report": <FileText size={11} className="text-[#9ca3af]" />,
      "Survey report": <FileText size={11} className="text-[#9ca3af]" />,
      Plan: <FileText size={11} className="text-[#9ca3af]" />,
      Log: <Video size={11} className="text-[#9ca3af]" />,
      "Analysis report": <Camera size={11} className="text-[#9ca3af]" />,
    };

    const blocking = unresolvedEvidence(run.evidence);
    const blockingIds = new Set(blocking.map(e => e.id));
    const rejectedCount = blocking.filter(e => e.verdict === "rejected").length;

    return (
      <div className="space-y-3">
        <p className="text-[11px] text-[#656d78] leading-relaxed">
          Evidence is validated against the obligation it is linked to — format, completeness, and whether it actually
          discharges the action. Items marked <span className="font-medium text-[#0d1117]">synthetic</span> were generated
          by the agent for demonstration and graded by the same pipeline, which is a workflow illustration and not assurance.
        </p>

        {blocking.length > 0 && (
          <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-900">
              <AlertTriangle size={12} className="text-amber-600 flex-shrink-0" />
              {blocking.length === 1 ? "1 item is unresolved" : `${blocking.length} items are unresolved`}
              {rejectedCount > 0 && <span className="font-normal text-amber-800">({rejectedCount} rejected)</span>}
            </div>
            <p className="text-[10px] text-amber-800 leading-relaxed">
              Pick one, read what the validator said, then file a replacement against the same action. Once a
              replacement is accepted the old item is marked superseded and this stage clears.
            </p>
            {blocking.map((e: EvidenceItem) => (
              <div key={e.id} className="flex items-start gap-3 text-[11px]">
                <span className="font-mono text-amber-700 flex-shrink-0">{e.id}</span>
                <span className="text-[#374151] flex-1 min-w-0">{e.label}</span>
                <span className={`flex-shrink-0 capitalize ${e.verdict === "rejected" ? "text-red-600" : "text-amber-700"}`}>{e.verdict}</span>
                <button onClick={() => setViewing(e)}
                  className="px-2 py-1 rounded border border-amber-300 text-amber-800 text-[10px] hover:bg-amber-100 transition-colors flex-shrink-0">
                  Why
                </button>
                <button onClick={() => setFilingAgainst(e.actionId)}
                  className="px-2 py-1 rounded bg-amber-600 text-white text-[10px] font-medium hover:bg-amber-700 transition-colors flex items-center gap-1 flex-shrink-0">
                  <Upload size={10} /> Replace
                </button>
              </div>
            ))}
          </div>
        )}

        <UploadControl
          vessel={vessel}
          run={run}
          dispatch={dispatch}
          getToken={getToken}
          actionId={filingAgainst ?? run.actions[0]?.id ?? ""}
          onActionChange={setFilingAgainst}
        />

        <MicroTable>
          <THead cols={["Ref", "Document", "Type", "Origin", "Status", ""]} />
          <tbody className="divide-y divide-[#e2e4e9]">
            {run.evidence.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-4 text-[#9ca3af]">No evidence submitted yet.</td></tr>
            )}
            {run.evidence.map((e: EvidenceItem) => {
              const superseded = e.verdict !== "accepted" && !blockingIds.has(e.id);
              return (
                <tr key={e.id} className="hover:bg-[#f8f9fa]">
                  <td className="px-4 py-2 font-mono text-[#9ca3af]">{e.id}</td>
                  <td className="px-4 py-2 text-[#0d1117]">{e.label}</td>
                  <td className="px-4 py-2"><div className="flex items-center gap-1.5 text-[#656d78]">{ti[e.type] ?? <FileText size={11} className="text-[#9ca3af]" />}{e.type}</div></td>
                  <td className="px-4 py-2 text-[#9ca3af]">{e.uploadedFilename ? "uploaded" : "synthetic"}</td>
                  <td className={`px-4 py-2 font-medium capitalize ${superseded ? "text-[#9ca3af]" : sc[e.verdict]}`}>
                    {e.verdict}{superseded && <span className="normal-case font-normal"> · superseded</span>}
                  </td>
                  <td className="pr-4 py-2">
                    <button onClick={() => setViewing(e)} title="View the validator's finding"
                      className="text-[#c8cbd0] hover:text-[#2d6aad] transition-colors">
                      <Eye size={11} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </MicroTable>

        {viewing && <EvidenceViewer item={viewing} run={run} onClose={() => setViewing(null)} />}
      </div>
    );
  }

  // ── Stage 6: the human decision ────────────────────────────────────────────
  const queue = run.approvals;
  const outstanding = queue.filter(a => a.state === "awaiting");
  const seededDecisions = queue.filter(a => a.seeded).length;

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-[#656d78] leading-relaxed">
        {queue.length === 0
          ? "Nothing has reached the DPA queue for this hull."
          : outstanding.length === 0
            ? "Every item has had a decision. No model touches this stage."
            : `${outstanding.length} items awaiting DPA sign-off. Every agent-generated action requires an explicit human decision before the record is finalised — this stage is deliberately not automated.`}
      </p>
      {seededDecisions > 0 && (
        <p className="text-[10px] text-[#9ca3af] leading-relaxed">
          {seededDecisions === queue.length ? "These decisions" : `${seededDecisions} of these decisions`} came with
          the demo fixture, not from a person reviewing them here. Anything you approve or return in this session is
          marked with the time you decided it.
        </p>
      )}
      {queue.length > 0 && (
        <div className="space-y-2">
          {queue.map((item: ApprovalItem) => {
            const isReturning = returning === item.id;
            return (
              <div key={item.id} className={`border rounded p-4 ${
                item.state === "approved" ? "border-emerald-200 bg-emerald-50/30"
                : item.state === "returned" ? "border-amber-200 bg-amber-50/30"
                : "border-[#e2e4e9] bg-white"}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono text-[#9ca3af] mb-1">{item.id}</div>
                    <p className="text-[11px] text-[#374151] leading-relaxed">{item.summary}</p>
                    {item.note && (
                      <p className="text-[11px] text-amber-800 leading-relaxed mt-1.5">
                        Returned: {item.note}
                      </p>
                    )}
                    {item.decidedAt && (
                      <p className="text-[10px] text-[#9ca3af] mt-1">
                        {item.state === "approved" ? "Approved" : "Returned"} {new Date(item.decidedAt).toISOString().slice(0, 16).replace("T", " ")} UTC
                        {item.seeded && " · demo fixture"}
                      </p>
                    )}
                    {isReturning && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          autoFocus
                          value={note}
                          onChange={e => setNote(e.target.value)}
                          placeholder="Why is this going back to the vessel?"
                          className="flex-1 text-[11px] px-2 py-1.5 rounded border border-[#e2e4e9] outline-none focus:border-[#2d6aad] text-[#0d1117] placeholder-[#9ca3af]"
                        />
                        <button
                          onClick={() => {
                            dispatch({ type: "decide", approvalId: item.id, state: "returned", note: note.trim() || "No reason given." });
                            setReturning(null);
                            setNote("");
                          }}
                          className="px-3 py-1.5 rounded bg-amber-600 text-white text-[11px] font-medium hover:bg-amber-700 transition-colors">
                          Confirm
                        </button>
                        <button onClick={() => { setReturning(null); setNote(""); }}
                          className="px-3 py-1.5 rounded border border-[#e2e4e9] text-[11px] text-[#656d78] hover:bg-[#f5f6f8] transition-colors">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {item.state === "approved" ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                        <CheckCircle2 size={12} /> Approved
                      </span>
                    ) : item.state === "returned" ? (
                      <button
                        onClick={() => dispatch({ type: "decide", approvalId: item.id, state: "awaiting" })}
                        className="px-3 py-1.5 rounded border border-[#e2e4e9] text-[11px] text-[#656d78] hover:bg-[#f5f6f8] transition-colors">
                        Reopen
                      </button>
                    ) : !isReturning ? (
                      <>
                        <button onClick={() => { setReturning(item.id); setNote(""); }}
                          className="px-3 py-1.5 rounded border border-[#e2e4e9] text-[11px] text-[#656d78] hover:bg-[#f5f6f8] transition-colors">
                          Return
                        </button>
                        <button onClick={() => dispatch({ type: "decide", approvalId: item.id, state: "approved" })}
                          className="px-3 py-1.5 rounded bg-[#2d6aad] text-white text-[11px] font-medium hover:bg-blue-800 transition-colors flex items-center gap-1.5">
                          <Stamp size={11} /> Approve
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── EVIDENCE VIEWER ───────────────────────────────────────────────────────────

function EvidenceViewer({ item, run, onClose }: { item: EvidenceItem; run: VesselRun; onClose: () => void }) {
  const action = run.actions.find(a => a.id === item.actionId);
  const requirement = action ? run.requirements.find(r => r.id === action.requirementId) : undefined;
  const record = requirement ? CORPUS_BY_ID[requirement.sourceId] : undefined;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative w-full max-w-[520px] bg-white rounded-lg shadow-xl border border-[#e2e4e9] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#e2e4e9]">
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-[#0d1117] truncate">{item.label}</div>
            <div className="text-[10px] text-[#9ca3af] font-mono">{item.id}</div>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-[#9ca3af] hover:text-[#0d1117] rounded hover:bg-[#f5f6f8]">
            <X size={12} />
          </button>
        </div>
        <div className="px-4 py-3 space-y-3">
          {!item.uploadedFilename && (
            <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
              Synthetic — generated for this demo. Not a valid certificate or record.
            </div>
          )}
          {item.uploadedFilename && (
            <div className="text-[10px] text-[#656d78] bg-[#f8f9fa] border border-[#e2e4e9] rounded px-2 py-1.5 font-mono truncate">
              {item.uploadedFilename}
            </div>
          )}
          <div>
            <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1">Validator finding</div>
            <p className="text-[11px] text-[#374151] leading-relaxed">{item.reason}</p>
          </div>
          {action && (
            <div>
              <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1">Linked action</div>
              <p className="text-[11px] text-[#374151] leading-relaxed">{action.action}</p>
              <p className="text-[10px] text-[#9ca3af] mt-0.5 font-mono">{action.id} · due {action.due}</p>
            </div>
          )}
          {record && (
            <div>
              <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1">Traces to</div>
              <p className="text-[11px] text-[#374151] leading-relaxed">{record.instrument} — {record.reference}</p>
              <p className="text-[11px] text-[#656d78] leading-relaxed mt-0.5">{record.summary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── UPLOAD ────────────────────────────────────────────────────────────────────

function UploadControl({ vessel, run, dispatch, getToken, actionId, onActionChange }: {
  vessel: Vessel;
  run: VesselRun;
  dispatch: React.Dispatch<import("./state").Action>;
  getToken: () => Promise<string | null>;
  /** Which action the document is being filed against. Owned by the caller so
   *  stage 4 can point this at a specific overdue item. */
  actionId: string;
  onActionChange: (id: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ verdict: string; reason: string } | null>(null);

  const action = run.actions.find(a => a.id === actionId);
  const requirement = action ? run.requirements.find(r => r.id === action.requirementId) : undefined;

  /** Ids elsewhere are hash-derived and unique; these are not, so make them so. */
  function evidenceId(name: string): string {
    const stem = name.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, "X");
    const taken = new Set(run.evidence.map(e => e.id));
    let id = `EV-${stem}`;
    for (let n = 2; taken.has(id); n++) id = `EV-${stem}${n}`;
    return id;
  }

  async function onFile(file: File) {
    if (!action || !requirement) { setError("Pick an action to file this against."); return; }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const verdict = await validateUpload(
        { vessel, actionText: action.action, sourceId: requirement.sourceId, file },
        getToken,
      );
      const reason = verdict.concerns.length > 0
        ? `${verdict.reason} Concerns: ${verdict.concerns.join("; ")}`
        : verdict.reason;
      dispatch({
        type: "upload",
        vesselId: vessel.id,
        item: {
          id: evidenceId(file.name),
          actionId: action.id,
          label: file.name,
          type: requirement.evidenceType,
          verdict: verdict.verdict,
          reason,
          uploadedFilename: file.name,
        },
      });
      setResult({ verdict: verdict.verdict, reason });
    } catch (err) {
      setError(err instanceof RunError ? err.message : "Validation failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (run.actions.length === 0) return null;

  const rc: Record<string, string> = { accepted: "text-emerald-700", rejected: "text-red-600", pending: "text-amber-700" };

  return (
    <div className="border border-[#e2e4e9] rounded-lg p-3 bg-white space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={actionId}
          onChange={e => { onActionChange(e.target.value); setResult(null); }}
          className="flex-1 min-w-0 text-[11px] px-2 py-1.5 rounded border border-[#e2e4e9] outline-none focus:border-[#2d6aad] text-[#0d1117] bg-white">
          {run.actions.map(a => (
            <option key={a.id} value={a.id}>{a.id} — {a.action.slice(0, 70)}</option>
          ))}
        </select>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="px-3 py-1.5 rounded bg-[#2d6aad] text-white text-[11px] font-medium hover:bg-blue-800 transition-colors flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50 disabled:cursor-wait">
          <Upload size={11} /> {busy ? "Validating…" : "Upload evidence"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) void onFile(f); }}
        />
      </div>
      {result && (
        <p className="text-[11px] leading-relaxed">
          <span className={`font-medium capitalize ${rc[result.verdict]}`}>{result.verdict}</span>
          <span className="text-[#656d78]"> — {result.reason}</span>
        </p>
      )}
      <p className="text-[10px] text-[#9ca3af] leading-relaxed">
        PDF, PNG, JPEG or WebP, up to {Math.round(MAX_UPLOAD_BYTES / 1_000_000)} MB. The document is read by the
        validator and judged against the linked obligation. Do not upload real crew, certificate or commercially
        sensitive records — this is a demo and the file is sent to a model provider.
        {error && <span className="block text-red-600 mt-1">{error}</span>}
      </p>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<string>("dashboard");
  const [overlay, dispatch] = useReducer(reducer, undefined, loadOverlay);
  const [runState, setRunState] = useState<RunState>({ busy: false, label: "", error: null });
  const { getToken } = useAuth();

  // `weeklyReport` carries the "persist this session" preference — the field
  // name is left alone so a stored overlay from an earlier build still loads.
  useEffect(() => {
    if (overlay.settings.weeklyReport) saveOverlay(overlay);
  }, [overlay]);

  const canonical = canonicalJson as unknown as Parameters<typeof project>[0];
  const projection = useMemo(() => project(canonical, overlay), [canonical, overlay]);
  const rows = useMemo(() => buildRows(projection), [projection]);

  const token = useCallback(() => getToken(), [getToken]);

  const runOne = useCallback(async (vessel: Vessel) => {
    setRunState({ busy: true, label: `${vessel.name.replace("Matsu ", "")}…`, error: null });
    try {
      const { run, events } = await runVessel(vessel, token, (stage, note) => {
        setRunState({ busy: true, label: `${STAGE_LABELS[stage].short}: ${note}`, error: null });
      });
      dispatch({ type: "vesselRun", run, events });
      setRunState({ busy: false, label: "", error: null });
    } catch (err) {
      setRunState({
        busy: false,
        label: "",
        error: err instanceof RunError ? err.message : "Agent run failed.",
      });
    }
  }, [token]);

  const runAll = useCallback(async () => {
    setRunState({ busy: true, label: "starting…", error: null });
    try {
      for (const vessel of FLEET) {
        const { run, events } = await runVessel(vessel, token, (stage, note) => {
          setRunState({
            busy: true,
            label: `${vessel.name.replace("Matsu ", "")} · ${STAGE_LABELS[stage].short}`,
            error: null,
          });
          void note;
        });
        dispatch({ type: "vesselRun", run, events });
      }
      setRunState({ busy: false, label: "", error: null });
    } catch (err) {
      setRunState({
        busy: false,
        label: "",
        error: err instanceof RunError ? err.message : "Agent run failed.",
      });
    }
  }, [token]);

  const activeRow = rows.find(r => r.vessel.id === page);

  return (
    // h-dvh rather than the export's h-screen: on mobile Safari, 100vh is taller
    // than the visible area, so h-screen pushes the sidebar footer under the URL
    // bar. Identical on desktop.
    <div className="h-dvh flex bg-white overflow-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <Sidebar active={page} onNav={setPage} rows={rows} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {page === "dashboard" || !activeRow ? (
          <>
            <TopBar
              title={`Fleet Overview: ${OPERATOR}`}
              onNav={setPage}
              rows={rows}
              projection={projection}
              overlay={overlay}
              dispatch={dispatch}
              runState={runState}
              onRunAll={runAll}
            />
            <Dashboard onNav={setPage} rows={rows} projection={projection} runState={runState} />
          </>
        ) : (
          <>
            <TopBar
              title={activeRow.vessel.name}
              subtitle={`${typeLabel(activeRow.vessel)} · ${activeRow.vessel.flag} · ${activeRow.vessel.route}`}
              showBack
              onBack={() => setPage("dashboard")}
              onNav={setPage}
              rows={rows}
              projection={projection}
              overlay={overlay}
              dispatch={dispatch}
              runState={runState}
              onRunAll={runAll}
            />
            <VesselPage
              row={activeRow}
              dispatch={dispatch}
              onRunVessel={runOne}
              runState={runState}
              getToken={token}
            />
          </>
        )}
      </div>
    </div>
  );
}
