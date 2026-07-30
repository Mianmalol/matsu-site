// ═══════════════════════════════════════════════════════════════════════════
//  PRODUCT DEMO · /demo
//
//  A faithful port of the Figma Make export at
//  ~/Downloads/Product demo for AI agents/src/app/App.tsx.
//
//  Formatting deliberately follows the export rather than the rest of this repo
//  — double quotes, semicolons, arbitrary-hex Tailwind (text-[#0d1117]) instead
//  of the @theme tokens. The demo gets re-exported from Figma Make whenever the
//  design changes, and keeping this diffable against that export is worth more
//  than internal consistency in a file nothing else imports.
//
//  Three deliberate departures from the export, all documented at their sites:
//    · the account row shows a role, never a named individual at PIL
//    · the sidebar avatar is Clerk's UserButton, so sign-out is reachable
//    · one "Demo data" chip in the top bar
//
//  The compliance state on these 109 real PIL hulls is illustrative. It is not
//  a record of any vessel's actual condition.
//
//  Substituted because the export's dependencies aren't in this project:
//    lucide-react → ./icons (hand-written, stroke-matched)
//    recharts     → Sparkline below (~100KB gzipped for seven points)
//  The export also imports Ship, Clock, RefreshCw, AlertCircle and a logo PNG
//  and uses none of them, so they are dropped rather than reimplemented.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  ScanSearch, ListFilter, Anchor, ClipboardList,
  FolderOpen, UserCheck, ChevronRight,
  ArrowLeft, Bell, Settings, Search, BarChart2,
  CheckCircle2, FileText, Camera, Video, Eye, Stamp,
} from "./icons";
import { AccountButton } from "@/auth/AuthGate";

// ── TYPES ─────────────────────────────────────────────────────────────────────

type StageStatus = "complete" | "active" | "needs-review" | "pending";

interface PipelineStage {
  id: number; label: string; shortLabel: string; icon: React.ElementType;
  status: StageStatus; summary: string; count: number; countLabel: string;
}

interface Vessel {
  id: string; name: string; type: string; flag: string;
  year: string; teu: number; route: string;
  overallStatus: StageStatus; stages: PipelineStage[];
}

// ── STAGE TEMPLATES ───────────────────────────────────────────────────────────

const ST = [
  { id: 1, label: "Regulation Scanning",    shortLabel: "Scanning",   icon: ScanSearch    },
  { id: 2, label: "Requirement Extraction", shortLabel: "Extraction", icon: ListFilter    },
  { id: 3, label: "Vessel Assignment",      shortLabel: "Assignment", icon: Anchor        },
  { id: 4, label: "Action Assignment",      shortLabel: "Actions",    icon: ClipboardList },
  { id: 5, label: "Evidence Collection",    shortLabel: "Evidence",   icon: FolderOpen    },
  { id: 6, label: "DPA Approval",           shortLabel: "Approval",   icon: UserCheck     },
];

// Expose as STAGE_TEMPLATES for StageDetail references
const STAGE_TEMPLATES = ST;

// ── VESSEL FACTORY ────────────────────────────────────────────────────────────

function reqCount(teu: number): number {
  if (teu === 0) return 0;
  if (teu > 12000) return 84;
  if (teu > 8000) return 78;
  if (teu > 5000) return 74;
  if (teu > 3000) return 69;
  if (teu > 1500) return 64;
  if (teu > 800)  return 61;
  return 57;
}

function actCount(req: number): number { return Math.round(req * 0.93); }

const ROUTES: Record<string, string[]> = {
  xl:     ["Shanghai → Buenos Aires (SAX2)", "Tianjin → Santos (SAX2)", "Ningbo → Santos (SAX)", "Qingdao → Callao (SAX)"],
  large:  ["Singapore → Tema (SWS)", "Qingdao → Lagos (SWS)", "Busan → Abidjan (SWS)", "Shanghai → Dakar (SWS)"],
  mlarge: ["Ningbo → Mombasa (AFX)", "Singapore → Durban (AFX2)", "Tianjin → Luanda", "Shanghai → Dar es Salaam"],
  mid:    ["Port Klang → Jeddah (MEX)", "Singapore → Sohar (MEX2)", "Busan → Aqaba", "Shanghai → Salalah"],
  small:  ["Singapore → Colombo (IAS)", "Port Klang → Chennai (ISAS)", "Singapore → Manila (PEX)", "Busan → Bangkok"],
  feeder: ["Singapore → Jakarta", "Port Klang → Penang", "Singapore → Ho Chi Minh", "Singapore → Surabaya"],
  tiny:   ["Singapore → Port Moresby (PAC)", "Port Klang → Kuching", "Singapore → Davao", "Tanjung Pelepas → Sandakan"],
};

function getRoute(teu: number, idx: number): string {
  if (teu === 0) return "On order — pending delivery";
  const bucket =
    teu > 12000 ? "xl" :
    teu > 8000  ? "large" :
    teu > 5500  ? "mlarge" :
    teu > 3000  ? "mid" :
    teu > 1500  ? "small" :
    teu > 800   ? "feeder" : "tiny";
  const arr = ROUTES[bucket];
  return arr[idx % arr.length];
}

function makeStages(teu: number, flag: string, status: StageStatus, idx: number): PipelineStage[] {
  const rq = reqCount(teu);
  const ac = actCount(rq);
  const done = Math.round(ac * (0.60 + (idx % 5) * 0.05));
  const evDone = Math.round(done * 0.88);
  const qCount = Math.max(1, Math.round((ac - done) * 0.7));
  const sizeLabel = teu > 10000 ? "ultra-large container" : teu > 5000 ? "large container" : teu > 2000 ? "mid-size container" : "feeder container";

  if (status === "pending") return [
    { ...ST[0], status: "complete",  summary: `2,847 regulations indexed. ${flag} flag requirements current.`, count: 2847, countLabel: "regulations scanned" },
    { ...ST[1], status: "complete",  summary: `${rq} requirements extracted for ${sizeLabel} vessel profile.`, count: rq, countLabel: "requirements extracted" },
    { ...ST[2], status: "pending",   summary: "Vessel assignment pending — awaiting delivery confirmation.", count: 0, countLabel: "requirements assigned" },
    { ...ST[3], status: "pending",   summary: "Action generation will begin once vessel is assigned.", count: 0, countLabel: "actions pending" },
    { ...ST[4], status: "pending",   summary: "Evidence collection not yet started.", count: 0, countLabel: "evidence pending" },
    { ...ST[5], status: "pending",   summary: "DPA queue will open after evidence is collected.", count: 0, countLabel: "awaiting DPA" },
  ];

  if (status === "complete") return [
    { ...ST[0], status: "complete", summary: `2,847 regulations indexed. ${flag} flag and ECA rules current.`, count: 2847, countLabel: "regulations scanned" },
    { ...ST[1], status: "complete", summary: `${rq} discrete obligations extracted for ${sizeLabel} profile.`, count: rq, countLabel: "requirements extracted" },
    { ...ST[2], status: "complete", summary: `All ${rq} requirements assigned. ${flag} flag and trading area rules factored in.`, count: rq, countLabel: "requirements assigned" },
    { ...ST[3], status: "complete", summary: `${ac} compliance actions completed — certificates, drills, and ORB records all done.`, count: ac, countLabel: "actions completed" },
    { ...ST[4], status: "complete", summary: `${ac} evidence items validated — drill reports, certificates, and ORB entries accepted.`, count: ac, countLabel: "items accepted" },
    { ...ST[5], status: "complete", summary: `DPA approved all ${ac} actions. Zero items outstanding. Compliance cycle closed.`, count: ac, countLabel: "actions approved" },
  ];

  if (status === "active") return [
    { ...ST[0], status: "complete", summary: `2,847 regulations indexed. ${flag} flag requirements and MoU circulars current.`, count: 2847, countLabel: "regulations scanned" },
    { ...ST[1], status: "complete", summary: `${rq} requirements extracted for ${sizeLabel} vessel.`, count: rq, countLabel: "requirements extracted" },
    { ...ST[2], status: "complete", summary: `${rq} requirements assigned. Trading area and ${flag} flag rules factored in.`, count: rq, countLabel: "requirements assigned" },
    { ...ST[3], status: "active",   summary: `${done} of ${ac} actions completed. ${ac - done} in progress — certificates and drill records pending.`, count: done, countLabel: `of ${ac} actions done` },
    { ...ST[4], status: "active",   summary: `${evDone} evidence items accepted. ${done - evDone} awaited from vessel.`, count: evDone, countLabel: `of ${done} items accepted` },
    { ...ST[5], status: "active",   summary: `${qCount} items in DPA queue — documentation ready for sign-off.`, count: qCount, countLabel: "awaiting DPA approval" },
  ];

  // needs-review
  const flagged = Math.max(2, Math.round(ac * 0.05));
  return [
    { ...ST[0], status: "complete",      summary: `2,847 regulations indexed. ${flag} flag and port state requirements current.`, count: 2847, countLabel: "regulations scanned" },
    { ...ST[1], status: "complete",      summary: `${rq} requirements extracted. Recent MoU circular added ${Math.round(rq * 0.04)} new obligations.`, count: rq, countLabel: "requirements extracted" },
    { ...ST[2], status: "complete",      summary: `${rq} requirements assigned based on ${sizeLabel} profile and ${flag} flag.`, count: rq, countLabel: "requirements assigned" },
    { ...ST[3], status: "active",        summary: `${done} of ${ac} actions completed. ${flagged} actions paused pending evidence resubmission.`, count: done, countLabel: `of ${ac} actions done` },
    { ...ST[4], status: "needs-review",  summary: `Evidence flagged — ${flagged} items rejected or incomplete. Resubmission required before next port call.`, count: flagged, countLabel: "items flagged" },
    { ...ST[5], status: "pending",       summary: `Blocked by evidence resubmission. DPA queue opens once ${flagged} items are resolved.`, count: 0, countLabel: "awaiting DPA" },
  ];
}

function makeVessel(
  name: string, flag: string, year: number | null, teu: number, status: StageStatus, idx: number
): Vessel {
  const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const type = teu === 0 ? "Container (on order)" : `Container — ${teu.toLocaleString()} TEU`;
  return {
    id, name, flag,
    year: year ? String(year) : "—",
    teu,
    type,
    route: getRoute(teu, idx),
    overallStatus: status,
    stages: makeStages(teu, flag, status, idx),
  };
}

// ── FLEET DATA ────────────────────────────────────────────────────────────────
// [name, flag, year, teu, status]
type Spec = [string, string, number | null, number, StageStatus];

const FLEET: Spec[] = [
  ["Asterios",              "Liberia",           2023, 1827,  "active"],
  ["Kota Anggun",           "Singapore",         1999, 1454,  "complete"],
  ["Kota Azam",             "Singapore",         1999, 1454,  "complete"],
  ["Kota Cabar",            "Singapore",         2012, 6606,  "complete"],
  ["Kota Cahaya",           "Singapore",         2012, 6606,  "complete"],
  ["Kota Callao",           "Marshall Islands",  null, 7092,  "needs-review"],
  ["Kota Cantik",           "Singapore",         2012, 6606,  "complete"],
  ["Kota Carum",            "Singapore",         2011, 6606,  "complete"],
  ["Kota Cempaka",          "Singapore",         2013, 6606,  "complete"],
  ["Kota Cepat",            "Singapore",         2013, 6606,  "complete"],
  ["Kota Dahlia",           "Singapore",         2008, 628,   "complete"],
  ["Kota Dunia",            "Singapore",         2010, 628,   "complete"],
  ["Kota Duta",             "Singapore",         2011, 628,   "complete"],
  ["Kota Eagle",            "Singapore",         2024, 14450, "active"],
  ["Kota Ebony",            "Singapore",         2025, 14450, "active"],
  ["Kota Embun",            "Singapore",         2025, 14410, "active"],
  ["Kota Emerald",          "Singapore",         2025, 14450, "needs-review"],
  ["Kota Gabung",           "Singapore",         2013, 2754,  "complete"],
  ["Kota Gadang",           "Singapore",         2013, 2800,  "complete"],
  ["Kota Ganding",          "Singapore",         2013, 2800,  "complete"],
  ["Kota Gaya",             "Singapore",         2012, 2754,  "complete"],
  ["Kota Hakim",            "Singapore",         2001, 1080,  "complete"],
  ["Kota Halus",            "Singapore",         2002, 1080,  "complete"],
  ["Kota Handal",           "Singapore",         2003, 1080,  "complete"],
  ["Kota Hapas",            "Singapore",         null, 1080,  "complete"],
  ["Kota Harum",            "Singapore",         2002, 1080,  "complete"],
  ["Kota Hening",           "Singapore",         2003, 1080,  "complete"],
  ["Kota Hidayah",          "Singapore",         2002, 1170,  "complete"],
  ["Kota Jaya",             "Singapore",         2000, 1728,  "complete"],
  ["Kota Johan",            "Singapore",         2017, 2034,  "complete"],
  ["Kota Kamil",            "Singapore",         2006, 3081,  "complete"],
  ["Kota Karim",            "Singapore",         2006, 3081,  "complete"],
  ["Kota Kaya",             "Singapore",         2005, 3081,  "complete"],
  ["Kota Lambai",           "Singapore",         2008, 4253,  "complete"],
  ["Kota Lambang",          "Singapore",         2008, 4253,  "complete"],
  ["Kota Laris",            "Singapore",         2008, 4253,  "complete"],
  ["Kota Lawa",             "Singapore",         2008, 4253,  "complete"],
  ["Kota Layang",           "Singapore",         2009, 4253,  "complete"],
  ["Kota Legit",            "Singapore",         2014, 4800,  "complete"],
  ["Kota Lekas",            "Singapore",         2014, 4800,  "complete"],
  ["Kota Lembah",           "Singapore",         2013, 4335,  "complete"],
  ["Kota Lestari",          "Singapore",         2014, 4335,  "complete"],
  ["Kota Lihat",            "Singapore",         2013, 4335,  "complete"],
  ["Kota Lima",             "Liberia",           2002, 5544,  "complete"],
  ["Kota Loceng",           "Singapore",         2013, 4335,  "complete"],
  ["Kota Lumayan",          "Singapore",         2010, 4253,  "complete"],
  ["Kota Lumba",            "Hong Kong",         2010, 4253,  "complete"],
  ["Kota Machan",           "Singapore",         2013, 3566,  "complete"],
  ["Kota Makmur",           "Hong Kong",         2013, 3566,  "complete"],
  ["Kota Manis",            "Singapore",         2013, 3566,  "complete"],
  ["Kota Manzanillo",       "Liberia",           2005, 8533,  "needs-review"],
  ["Kota Megah",            "Singapore",         2013, 3566,  "complete"],
  ["Kota Nabil",            "Singapore",         2008, 1810,  "complete"],
  ["Kota Naga",             "Singapore",         2008, 1810,  "complete"],
  ["Kota Naluri",           "Singapore",         2008, 1810,  "complete"],
  ["Kota Nanhai",           "Singapore",         2008, 1810,  "complete"],
  ["Kota Nasrat",           "Singapore",         2008, 1810,  "complete"],
  ["Kota Nazar",            "Singapore",         2009, 1810,  "complete"],
  ["Kota Nazim",            "Singapore",         2008, 1810,  "complete"],
  ["Kota Nebula",           "Singapore",         2010, 1810,  "complete"],
  ["Kota Nekad",            "Panama",            2009, 1810,  "complete"],
  ["Kota Nilam",            "Singapore",         2009, 1810,  "complete"],
  ["Kota Nipah",            "Singapore",         2011, 1810,  "complete"],
  ["Kota Oasis",            "Singapore",         2025, 8350,  "complete"],
  ["Kota Ocean",            "Singapore",         null, 8350,  "active"],
  ["Kota Odyssey",          "Singapore",         2025, 8350,  "needs-review"],
  ["Kota Orkid",            "Singapore",         2025, 8350,  "complete"],
  ["Kota Pahlawan",         "Singapore",         2017, 11923, "active"],
  ["Kota Pelangi",          "Singapore",         2018, 11923, "complete"],
  ["Kota Peony",            "Liberia",           2012, 13082, "complete"],
  ["Kota Plumbago",         "Greece",            2012, 13082, "complete"],
  ["Kota Primrose",         "Liberia",           2012, 13082, "complete"],
  ["Kota Puri",             "Hong Kong",         2019, 11923, "complete"],
  ["Kota Pusaka",           "Hong Kong",         2019, 11923, "complete"],
  ["Kota Rahmat",           "Singapore",         2008, 907,   "complete"],
  ["Kota Raja",             "Singapore",         1998, 777,   "complete"],
  ["Kota Rajin",            "Singapore",         2005, 943,   "complete"],
  ["Kota Rakan",            "Singapore",         2008, 907,   "complete"],
  ["Kota Rakyat",           "Singapore",         2006, 907,   "complete"],
  ["Kota Rancak",           "Singapore",         2005, 943,   "complete"],
  ["Kota Ratna",            "Singapore",         1998, 777,   "complete"],
  ["Kota Ratu",             "Singapore",         1998, 777,   "complete"],
  ["Kota Restu",            "Singapore",         2009, 943,   "complete"],
  ["Kota Ria",              "Singapore",         2006, 907,   "complete"],
  ["Kota Rukun",            "Singapore",         1998, 777,   "complete"],
  ["Kota Sabas",            "Singapore",         2014, 3889,  "complete"],
  ["Kota Sahabat",          "Singapore",         2014, 3889,  "complete"],
  ["Kota Salam",            "Singapore",         2014, 3889,  "complete"],
  ["Kota Santos",           "Liberia",           2005, 8463,  "complete"],
  ["Kota Satria",           "Singapore",         2014, 3889,  "complete"],
  ["Kota Segar",            "Singapore",         2014, 3889,  "complete"],
  ["Kota Sejarah",          "Singapore",         2014, 3889,  "complete"],
  ["Kota Sejati",           "Singapore",         2015, 3889,  "complete"],
  ["Kota Selamat",          "Singapore",         2015, 3889,  "complete"],
  ["Kota Sempena",          "Singapore",         2015, 3889,  "complete"],
  ["Kota Setia",            "Singapore",         2015, 3889,  "complete"],
  ["Kota Singa",            "Singapore",         2015, 3889,  "complete"],
  ["Kota Suria",            "Singapore",         2015, 3889,  "complete"],
  ["Kota Sydney",           "Singapore",         null, 7092,  "complete"],
  ["Kota Tema",             "Singapore",         2024, 7092,  "complete"],
  ["Kota Tenaga",           "Singapore",         2002, 728,   "complete"],
  ["Kota Valparaiso",       "Marshall Islands",  2024, 7092,  "complete"],
  ["Little Mermaid",        "Liberia",           2022, 1781,  "complete"],
  ["Pacanda",               "Antigua & Barbuda", 2007, 0,     "complete"],
  ["Salam Maju",            "Malaysia",          2001, 1170,  "complete"],
  ["SC Mara",               "Cyprus",            2006, 5060,  "complete"],
  ["Selatan Damai",         "Indonesia",         2017, 628,   "complete"],
  ["Zhong Hang Sheng",      "China",             2004, 2783,  "complete"],
  ["Zhu Cheng Xin Zhou",    "China",             2002, 2526,  "complete"],
];

const VESSELS: Vessel[] = FLEET.map(([name, flag, year, teu, status], idx) =>
  makeVessel(name, flag, year, teu, status, idx)
);

// The export declares a STATUS_STYLE map here and never reads it — every status
// colour comes from CHIP below or an inline ternary. Dropped rather than kept
// with a suppression, since `tsc --noEmit` runs as part of the build.

const fleetActivity = [
  { h: "08", v: 8 }, { h: "09", v: 21 }, { h: "10", v: 34 },
  { h: "11", v: 19 }, { h: "12", v: 27 }, { h: "13", v: 41 },
  { h: "14", v: 53 },
];

const agentFeed = [
  { time: "14:29", vessel: "Kota Ocean",    stage: "Evidence", action: "LNG bunker delivery notes received — routing to DPA", type: "info" },
  { time: "14:25", vessel: "Kota Odyssey",  stage: "Evidence", action: "Fuel oil sample rejected — sulphur mismatch 0.49% vs 0.52%", type: "warning" },
  { time: "14:22", vessel: "Kota Emerald",  stage: "Actions",  action: "LNG bunkering log gap detected — escalated as critical", type: "warning" },
  { time: "14:18", vessel: "Kota Orkid",    stage: "Approval", action: "DPA approved maiden voyage compliance cycle — zero deficiencies", type: "success" },
  { time: "14:15", vessel: "Kota Pahlawan", stage: "Evidence", action: "3 crew certificates received from vessel — validating", type: "info" },
];

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

function StagePips({ stages }: { stages: PipelineStage[] }) {
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
//
//  Two knowing departures: no hover tooltip, and y ticks at 0/35/70 rather than
//  the 0/17.5/35/52.5/70 recharts derives from a [0, 70] domain — half an action
//  per hour is not a real quantity.

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

function Sparkline({ data, max = 70 }: { data: { h: string; v: number }[]; max?: number }) {
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
              {t}
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

// ── SIDEBAR ───────────────────────────────────────────────────────────────────

function Sidebar({ active, onNav }: { active: string; onNav: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const filtered = search ? VESSELS.filter(v => v.name.toLowerCase().includes(search.toLowerCase())) : VESSELS;

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
        {filtered.map(v => {
          const isActive = active === v.id;
          const dot = v.overallStatus === "complete" ? "bg-emerald-500" : v.overallStatus === "active" ? "bg-[#2d6aad]" : v.overallStatus === "needs-review" ? "bg-amber-500" : "bg-gray-300";
          return (
            <button key={v.id} onClick={() => onNav(v.id)}
              className={`w-full flex items-center gap-2 px-3 py-[5px] rounded text-left transition-colors ${
                isActive ? "bg-[#eef3fa] text-[#0d1117]" : "text-[#656d78] hover:text-[#0d1117] hover:bg-[#f5f6f8]"
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
              <span className={`text-[12px] truncate flex-1 ${isActive ? "font-medium" : ""}`}>{v.name}</span>
            </button>
          );
        })}
      </nav>

      {/*
        Two departures from the export here, same footer.

        The export shows a named individual as PIL's DPA. PIL is a prospect with
        nothing signed, so a name is a claim about a real person at a real
        company that we are in no position to make. The role carries the whole
        point of the row anyway — someone ashore signs off — so only the role is
        shown.

        The avatar is Clerk's UserButton rather than initials, because this is
        the only chrome in the demo and sign-out has to be reachable from it.
      */}
      <div className="px-3 py-2.5 border-t border-[#e2e4e9] flex-shrink-0 flex items-center gap-2.5">
        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
          <AccountButton size={24} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-[#0d1117] truncate">Designated Person Ashore</div>
          <div className="text-[10px] text-[#9ca3af]">PIL</div>
        </div>
      </div>
    </aside>
  );
}

// ── TOP BAR ───────────────────────────────────────────────────────────────────

function TopBar({ title, subtitle, onBack, showBack, onNav }: {
  title: string; subtitle?: string; onBack?: () => void; showBack?: boolean; onNav?: (id: string) => void;
}) {
  const [searchOpen, setSearchOpen]     = useState(false);
  const [notifOpen, setNotifOpen]       = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");
  const [dpaEmail, setDpaEmail]         = useState(true);
  const [agentAlerts, setAgentAlerts]   = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  // Undefined when auth isn't configured, in which case the Account block falls
  // back to the operator rather than showing an empty line.
  const { user } = useUser();
  const accountEmail = user?.primaryEmailAddress?.emailAddress;

  const searchResults = searchQuery.length > 0
    ? VESSELS.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.route.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const notifications = [
    { id: 1, type: "warning", vessel: "Kota Emerald",  msg: "LNG bunkering log gap — 3 BDNs missing countersignatures", time: "2m ago",  unread: true  },
    { id: 2, type: "warning", vessel: "Kota Odyssey",  msg: "Fuel oil sample rejected — sulphur content mismatch",       time: "8m ago",  unread: true  },
    { id: 3, type: "warning", vessel: "Kota Callao",   msg: "SEEMP Part III overdue — CII rating period ending in 4 days", time: "23m ago", unread: true  },
    { id: 4, type: "success", vessel: "Kota Orkid",    msg: "DPA approved maiden voyage compliance cycle — zero deficiencies", time: "41m ago", unread: false },
    { id: 5, type: "info",    vessel: "Kota Pahlawan", msg: "3 crew certificates received from vessel — validation in progress", time: "1h ago", unread: false },
    { id: 6, type: "success", vessel: "Kota Oasis",    msg: "Full compliance cycle closed — all 71 actions approved",    time: "2h ago",  unread: false },
  ];
  const unreadCount = notifications.filter(n => n.unread).length;

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
          The one marker that the compliance state below is illustrative. The
          vessel identities, flags, build years and TEU are real; what the
          pipeline says about them is not. Deliberately the only place this is
          said — the fleet table and the vessel pages stay clean.
        */}
        <span
          className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] border border-[#e2e4e9] rounded px-1.5 py-[2px] flex-shrink-0"
          title="Vessel identities are real. Compliance state is illustrative."
        >
          Demo data
        </span>
        <div className="flex items-center gap-1.5 pr-3 border-r border-[#e2e4e9]">
          <span className="relative flex h-[7px] w-[7px]">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2d6aad] opacity-30" />
            <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-[#2d6aad]" />
          </span>
          <span className="text-[10px] text-[#9ca3af] font-medium">Agent running</span>
        </div>
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
              {notifications.map(n => {
                const dot = n.type === "success" ? "bg-emerald-500" : n.type === "warning" ? "bg-amber-500" : "bg-[#2d6aad]";
                return (
                  <div key={n.id} className={`px-4 py-2.5 hover:bg-[#f8f9fa] cursor-pointer ${n.unread ? "bg-[#fafbfc]" : ""}`}>
                    <div className="flex items-start gap-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[5px] ${dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-[11px] font-medium text-[#2d6aad]">{n.vessel}</span>
                          <span className="text-[10px] text-[#9ca3af] flex-shrink-0">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-[#374151] leading-relaxed">{n.msg}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-2 border-t border-[#e2e4e9]">
              <button className="text-[11px] text-[#2d6aad] hover:underline">Mark all as read</button>
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
                {/*
                  The export hardcoded a named person here too. This shows the
                  role plus whoever is actually signed in, so the block reflects
                  a real account instead of inventing one.
                */}
                <div className="flex items-center gap-2.5 p-2.5 bg-[#f8f9fa] rounded border border-[#e2e4e9]">
                  <div className="w-7 h-7 rounded-full bg-[#2d6aad] flex items-center justify-center text-white flex-shrink-0">
                    <UserCheck size={13} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-medium text-[#0d1117]">Designated Person Ashore</div>
                    <div className="text-[10px] text-[#9ca3af] truncate">{accountEmail ?? "PIL"}</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">Notifications</div>
                <div className="space-y-2.5">
                  {[
                    { label: "DPA approval requests", sub: "Alert when actions reach your queue", val: dpaEmail,     set: setDpaEmail     },
                    { label: "Agent alerts",           sub: "Evidence failures and blockers",      val: agentAlerts, set: setAgentAlerts   },
                    { label: "Weekly fleet report",    sub: "Every Monday 08:00 SGT",              val: weeklyReport, set: setWeeklyReport },
                  ].map(({ label, sub, val, set }) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] text-[#0d1117]">{label}</div>
                        <div className="text-[10px] text-[#9ca3af]">{sub}</div>
                      </div>
                      <button onClick={() => set((v: boolean) => !v)}
                        className={`relative rounded-full flex-shrink-0 transition-colors ${val ? "bg-[#2d6aad]" : "bg-[#d1d5db]"}`}
                        style={{ width: 30, height: 17 }}>
                        <span className={`absolute top-[2px] w-[13px] h-[13px] bg-white rounded-full shadow-sm transition-transform ${val ? "translate-x-[15px]" : "translate-x-[2px]"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">Agent</div>
                <div className="space-y-1.5">
                  {[["Scan frequency", "Every 6 hours"], ["Regulations indexed", "2,847"], ["Last sync", "14:29 SGT"]].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-[11px] text-[#656d78]">{k}</span>
                      <span className="text-[11px] font-medium text-[#0d1117]">{v}</span>
                    </div>
                  ))}
                </div>
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
                {VESSELS.filter(v => v.overallStatus !== "complete").slice(0, 5).map(v => (
                  <button key={v.id} onClick={() => { onNav?.(v.id); setSearchOpen(false); setSearchQuery(""); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-[#f5f6f8] transition-colors text-left">
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-medium text-[#0d1117]">{v.name}</span>
                      <span className="text-[11px] text-[#9ca3af] ml-2">{v.teu > 0 ? `${v.teu.toLocaleString()} TEU` : ""} · {v.flag}</span>
                    </div>
                    <StatusChip status={v.overallStatus} />
                  </button>
                ))}
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="max-h-72 overflow-y-auto divide-y divide-[#e2e4e9]">
                {searchResults.map(v => (
                  <button key={v.id} onClick={() => { onNav?.(v.id); setSearchOpen(false); setSearchQuery(""); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8f9fa] transition-colors text-left">
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-[#0d1117]">{v.name}</div>
                      <div className="text-[10px] text-[#9ca3af]">{v.route} · {v.flag}</div>
                    </div>
                    <StatusChip status={v.overallStatus} />
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

function Dashboard({ onNav }: { onNav: (id: string) => void }) {
  const complete    = VESSELS.filter(v => v.overallStatus === "complete").length;
  const active      = VESSELS.filter(v => v.overallStatus === "active").length;
  const needsReview = VESSELS.filter(v => v.overallStatus === "needs-review").length;
  const total       = VESSELS.length;
  const actionsTotal = VESSELS.reduce((sum, v) => sum + (v.stages[3].count || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {/* KPI strip */}
      <div className="flex items-stretch border-b border-[#e2e4e9] divide-x divide-[#e2e4e9]">
        {[
          { label: "Vessels compliant",   value: `${complete} / ${total}`, highlight: true  },
          { label: "Regulations indexed", value: "2,847",                  highlight: false },
          { label: "Actions in flight",   value: actionsTotal.toLocaleString(), highlight: false },
          { label: "Needs review",        value: String(needsReview),       highlight: false },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="flex flex-col justify-center px-6 py-3 flex-1">
            <div className="text-[10px] text-[#9ca3af] font-medium uppercase tracking-wider mb-0.5">{label}</div>
            <div className={`text-[20px] font-bold tabular-nums leading-tight ${highlight ? "text-[#2d6aad]" : "text-[#0d1117]"}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-5 space-y-5">
        <div className="grid grid-cols-5 gap-5">
          {/* Fleet table */}
          <div className="col-span-3">
            <h2 className="text-[11px] font-semibold text-[#656d78] uppercase tracking-wider mb-2">PIL Fleet — {total} vessels</h2>
            <div className="border border-[#e2e4e9] rounded-lg overflow-hidden">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#e2e4e9]">
                    <th className="text-left px-4 py-2 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider font-normal">Vessel</th>
                    <th className="text-left px-3 py-2 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider font-normal">Flag</th>
                    <th className="text-right px-3 py-2 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider font-normal">TEU</th>
                    <th className="px-3 py-2 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider font-normal">Stages</th>
                    <th className="px-4 py-2 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider font-normal">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e4e9]">
                  {VESSELS.slice(0, 14).map(v => (
                    <tr key={v.id} onClick={() => onNav(v.id)} className="hover:bg-[#f8f9fa] cursor-pointer transition-colors">
                      <td className="px-4 py-2.5 font-medium text-[#0d1117] hover:text-[#2d6aad]">{v.name}</td>
                      <td className="px-3 py-2.5 text-[#656d78]">{v.flag}</td>
                      <td className="px-3 py-2.5 text-right text-[#656d78] tabular-nums font-mono text-[11px]">
                        {v.teu > 0 ? v.teu.toLocaleString() : "—"}
                      </td>
                      <td className="px-3 py-2.5"><StagePips stages={v.stages} /></td>
                      <td className="px-4 py-2.5"><StatusChip status={v.overallStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2 border-t border-[#e2e4e9] bg-[#f8f9fa]">
                <button className="text-[11px] text-[#2d6aad] hover:underline">View all {total} vessels →</button>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="col-span-2 space-y-5">
            <div>
              <h2 className="text-[11px] font-semibold text-[#656d78] uppercase tracking-wider mb-2">Actions processed / hr</h2>
              <div className="border border-[#e2e4e9] rounded-lg p-4 bg-white">
                <Sparkline data={fleetActivity} max={70} />
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
                {STAGE_TEMPLATES.map((stage, i) => {
                  const Icon = stage.icon;
                  const doneCount = VESSELS.filter(v => v.stages[stage.id - 1].status === "complete").length;
                  return (
                    <div key={stage.id} className={`flex items-center gap-3 px-4 py-2.5 ${i < STAGE_TEMPLATES.length - 1 ? "border-b border-[#e2e4e9]" : ""}`}>
                      <span className="text-[10px] font-mono text-[#c8cbd0] w-4 flex-shrink-0">{stage.id}</span>
                      <Icon size={11} className="text-[#9ca3af] flex-shrink-0" />
                      <span className="text-[11px] text-[#656d78] flex-1">{stage.shortLabel}</span>
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
                {agentFeed.map((entry, i) => {
                  const dot = entry.type === "success" ? "bg-emerald-500" : entry.type === "warning" ? "bg-amber-500" : "bg-[#2d6aad]";
                  return (
                    <tr key={i} className="hover:bg-[#f8f9fa] transition-colors">
                      <td className="px-4 py-2.5 font-mono text-[#9ca3af]">{entry.time}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                          <span className="font-medium text-[#0d1117] truncate">{entry.vessel}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[#656d78]">{entry.stage}</td>
                      <td className="px-4 py-2.5 text-[#374151]">{entry.action}</td>
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

function VesselPage({ vessel }: { vessel: Vessel }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const stagesComplete = vessel.stages.filter(s => s.status === "complete").length;
  const currentStageIdx = vessel.stages.findIndex(s => s.status === "active" || s.status === "needs-review");

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="border-b border-[#e2e4e9] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-start gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[15px] font-semibold text-[#0d1117]">{vessel.name}</h1>
              <StatusChip status={vessel.overallStatus} />
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#9ca3af] flex-wrap">
              <span>{vessel.type}</span>
              <span>·</span>
              <span>Flag: <span className="text-[#656d78]">{vessel.flag}</span></span>
              <span>·</span>
              <span>Built: <span className="text-[#656d78]">{vessel.year}</span></span>
              <span>·</span>
              <span>Route: <span className="text-[#656d78]">{vessel.route}</span></span>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-[11px] text-[#9ca3af] mb-2">Compliance stages</div>
            <div className="flex items-end gap-1">
              {vessel.stages.map(s => {
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
          {vessel.stages.map((stage, i) => {
            const Icon = stage.icon;
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
                    <div className="text-[12px] font-medium text-[#0d1117]">{stage.label}</div>
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
                    <StageDetail stage={stage} vessel={vessel} />
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

function StageDetail({ stage, vessel }: { stage: PipelineStage; vessel: Vessel }) {
  const [approved, setApproved] = useState<string[]>([]);

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

  if (stage.id === 1) return (
    <div className="space-y-3">
      <p className="text-[11px] text-[#656d78] leading-relaxed">
        Monitoring 23 regulatory sources including IMO, flag state administrations, and regional MoUs.
        All applicable regulations for <strong className="text-[#0d1117] font-medium">{vessel.name}</strong> ({vessel.flag} flag) are indexed and kept current.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {[["IMO instruments", "14 active"], [`${vessel.flag} flag state`, "Current"], ["Regional MoUs", "Paris, Tokyo"]].map(([label, value]) => (
          <div key={label} className="border border-[#e2e4e9] rounded p-3 bg-white">
            <div className="text-[10px] text-[#9ca3af] mb-1">{label}</div>
            <div className="text-[12px] font-semibold text-[#0d1117]">{value}</div>
          </div>
        ))}
      </div>
      <MicroTable>
        <THead cols={["Instrument", "Status"]} />
        <tbody className="divide-y divide-[#e2e4e9]">
          {["SOLAS 2024", "MARPOL 73/78 Annex I–VI", "ISM Code Rev. 2024", "STCW Convention 2010", "MLC 2006 Amendments", "ISPS Code Part A & B"].map(reg => (
            <tr key={reg} className="hover:bg-[#f8f9fa]">
              <td className="px-4 py-2 text-[#0d1117]">
                <div className="flex items-center gap-2"><CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />{reg}</div>
              </td>
              <td className="px-4 py-2 text-[#9ca3af] font-mono">Indexed</td>
            </tr>
          ))}
        </tbody>
      </MicroTable>
    </div>
  );

  if (stage.id === 2) {
    const reqs = [
      { id: "REQ-0411", obligation: "Fixed fire detection systems tested within 12 months", category: "Safety" },
      { id: "REQ-0412", obligation: "SEEMP Part III with CII rating reviewed annually", category: "Environmental" },
      { id: "REQ-0410", obligation: "All crew hold valid basic safety training certificates", category: "Crew" },
      { id: "REQ-0409", obligation: "Emergency preparedness drills at required SOLAS frequency", category: "Safety" },
      { id: "REQ-0408", obligation: "Seafarer Employment Agreements signed before embarkation", category: "Labour" },
    ];
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-[#656d78] leading-relaxed">
          <strong className="text-[#0d1117] font-medium">{stage.count} discrete obligations</strong> extracted, each with a unique ID traceable to its source paragraph.
        </p>
        <MicroTable>
          <THead cols={["ID", "Obligation", "Category"]} />
          <tbody className="divide-y divide-[#e2e4e9]">
            {reqs.map(r => (
              <tr key={r.id} className="hover:bg-[#f8f9fa]">
                <td className="px-4 py-2 font-mono text-[#9ca3af]">{r.id}</td>
                <td className="px-4 py-2 text-[#0d1117]">{r.obligation}</td>
                <td className="px-4 py-2 text-[#656d78]">{r.category}</td>
              </tr>
            ))}
            <tr><td colSpan={3} className="px-4 py-2 text-[#9ca3af]">+{stage.count - reqs.length} more requirements</td></tr>
          </tbody>
        </MicroTable>
      </div>
    );
  }

  if (stage.id === 3) return (
    <div className="space-y-3">
      <p className="text-[11px] text-[#656d78] leading-relaxed">
        All <strong className="text-[#0d1117] font-medium">{stage.count} requirements</strong> matched to <strong className="text-[#0d1117] font-medium">{vessel.name}</strong> based on vessel type, flag state, trading area, and applicable conventions.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {[["Vessel type", vessel.type], ["Flag state", vessel.flag], ["Trading area", vessel.route.split(" → ")[1]?.split(" (")[0] ?? "—"], ["Requirements assigned", `${stage.count}`]].map(([label, value]) => (
          <div key={label} className="border border-[#e2e4e9] rounded p-3 bg-white">
            <div className="text-[10px] text-[#9ca3af] mb-1">{label}</div>
            <div className="text-[12px] font-semibold text-[#0d1117]">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (stage.id === 4) {
    const totalActions = vessel.stages[3].count;
    const actions = [
      { id: "ACT-1188", action: "Upload updated SEEMP Part III signed by Master",     due: "2025-07-31", status: stage.status === "complete" ? "done" : "in-progress" },
      { id: "ACT-1187", action: "Collect signed SEAs for joining crew members",        due: "2025-07-28", status: stage.status === "complete" ? "done" : "in-progress" },
      { id: "ACT-1186", action: "Conduct fire and abandon-ship drill — upload report", due: "2025-08-01", status: "done" },
      { id: "ACT-1185", action: "Update Ship Security Plan for current port rotation", due: "2025-07-26", status: stage.status === "needs-review" ? "overdue" : stage.status === "complete" ? "done" : "open" },
    ];
    const sc: Record<string, string> = { done: "text-emerald-700", "in-progress": "text-[#2d6aad]", open: "text-[#9ca3af]", overdue: "text-red-600" };
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-[#656d78] leading-relaxed">
          <strong className="text-[#0d1117] font-medium">{totalActions} compliance actions</strong> generated — each linked to a requirement with a due date and evidence type.
        </p>
        <MicroTable>
          <THead cols={["ID", "Action", "Due", "Status"]} />
          <tbody className="divide-y divide-[#e2e4e9]">
            {actions.map(a => (
              <tr key={a.id} className="hover:bg-[#f8f9fa]">
                <td className="px-4 py-2 font-mono text-[#9ca3af]">{a.id}</td>
                <td className="px-4 py-2 text-[#0d1117]">{a.action}</td>
                <td className="px-4 py-2 font-mono text-[#656d78]">{a.due}</td>
                <td className={`px-4 py-2 font-medium capitalize ${sc[a.status]}`}>{a.status}</td>
              </tr>
            ))}
            <tr><td colSpan={4} className="px-4 py-2 text-[#9ca3af]">+{totalActions - actions.length} more actions</td></tr>
          </tbody>
        </MicroTable>
      </div>
    );
  }

  if (stage.id === 5) {
    const ev = [
      { id: "EV-0143", label: "Fire & abandon-ship drill report", type: "PDF",   status: stage.status === "needs-review" ? "Flagged"  : "Accepted" },
      { id: "EV-0142", label: "ORB Part II — signed pages",       type: "PDF",   status: "Accepted" },
      { id: "EV-0141", label: "Fuel oil sample analysis cert",    type: "Photo", status: stage.status === "needs-review" ? "Rejected" : "Accepted" },
      { id: "EV-0140", label: "SEEMP Part III — Master signed",   type: "PDF",   status: stage.status === "complete" ? "Accepted" : "Pending" },
    ];
    const sc: Record<string, string> = { Accepted: "text-emerald-700", Rejected: "text-red-600", Pending: "text-amber-700", Flagged: "text-red-600" };
    const ti: Record<string, React.ReactNode> = {
      PDF: <FileText size={11} className="text-[#9ca3af]" />,
      Photo: <Camera size={11} className="text-[#9ca3af]" />,
      Video: <Video size={11} className="text-[#9ca3af]" />,
    };
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-[#656d78] leading-relaxed">
          Evidence submitted by the vessel is automatically validated — checking format, completeness, and whether it satisfies the linked requirement.
        </p>
        <MicroTable>
          <THead cols={["Ref", "Document", "Type", "Status", ""]} />
          <tbody className="divide-y divide-[#e2e4e9]">
            {ev.map(e => (
              <tr key={e.id} className="hover:bg-[#f8f9fa]">
                <td className="px-4 py-2 font-mono text-[#9ca3af]">{e.id}</td>
                <td className="px-4 py-2 text-[#0d1117]">{e.label}</td>
                <td className="px-4 py-2"><div className="flex items-center gap-1.5 text-[#656d78]">{ti[e.type]}{e.type}</div></td>
                <td className={`px-4 py-2 font-medium ${sc[e.status]}`}>{e.status}</td>
                <td className="pr-4 py-2"><Eye size={11} className="text-[#c8cbd0]" /></td>
              </tr>
            ))}
          </tbody>
        </MicroTable>
      </div>
    );
  }

  if (stage.id === 6) {
    const items = [
      { id: "APR-024", desc: "SEEMP Part III — CII rating confirmed. DPA sign-off required to close REQ-0412." },
      { id: "APR-023", desc: "Fire drill report accepted. Confirm SOLAS schedule met and all crew participated." },
    ];
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-[#656d78] leading-relaxed">
          {stage.count === 0
            ? "All actions approved by the DPA. No items outstanding."
            : `${stage.count} items awaiting DPA sign-off. Every AI-generated action requires explicit approval before the record is finalised.`}
        </p>
        {stage.count > 0 && (
          <div className="space-y-2">
            {items.map(item => {
              const isApproved = approved.includes(item.id);
              return (
                <div key={item.id} className={`border rounded p-4 ${isApproved ? "border-emerald-200 bg-emerald-50/30" : "border-[#e2e4e9] bg-white"}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono text-[#9ca3af] mb-1">{item.id}</div>
                      <p className="text-[11px] text-[#374151] leading-relaxed">{item.desc}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {isApproved ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                          <CheckCircle2 size={12} /> Approved
                        </span>
                      ) : (
                        <>
                          <button className="px-3 py-1.5 rounded border border-[#e2e4e9] text-[11px] text-[#656d78] hover:bg-[#f5f6f8] transition-colors">Return</button>
                          <button onClick={() => setApproved(p => [...p, item.id])}
                            className="px-3 py-1.5 rounded bg-[#2d6aad] text-white text-[11px] font-medium hover:bg-blue-800 transition-colors flex items-center gap-1.5">
                            <Stamp size={11} /> Approve
                          </button>
                        </>
                      )}
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

  return null;
}

// ── ROOT ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<string>("dashboard");
  const activeVessel = VESSELS.find(v => v.id === page);

  return (
    // h-dvh rather than the export's h-screen: on mobile Safari, 100vh is taller
    // than the visible area, so h-screen pushes the sidebar footer under the URL
    // bar. Identical on desktop.
    <div className="h-dvh flex bg-white overflow-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <Sidebar active={page} onNav={setPage} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {page === "dashboard" ? (
          <>
            <TopBar title="Fleet Overview: Pacific International Lines" onNav={setPage} />
            <Dashboard onNav={setPage} />
          </>
        ) : activeVessel ? (
          <>
            <TopBar
              title={activeVessel.name}
              subtitle={`${activeVessel.type} · ${activeVessel.flag} · ${activeVessel.route}`}
              showBack
              onBack={() => setPage("dashboard")}
              onNav={setPage}
            />
            <VesselPage vessel={activeVessel} />
          </>
        ) : null}
      </div>
    </div>
  );
}
