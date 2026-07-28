// Regenerates src/components/mapGeo.ts from real geographic data.
// Run from any temp dir (build-time tool — do NOT add these deps to the site):
//   npm i d3-geo topojson-client
//   curl -O https://unpkg.com/world-atlas@2.0.2/land-110m.json
//   node generate-map.mjs   (writes src/components/mapGeo.ts via absolute path below)
import { readFileSync, writeFileSync } from 'node:fs'
import { geoMercator, geoPath } from 'd3-geo'
import * as topojson from 'topojson-client'

const W = 1180, H = 560

const topo = JSON.parse(readFileSync('land-110m.json', 'utf8'))
const land = topojson.feature(topo, topo.objects.land)

// Region: Atlantic approaches -> NW Europe -> Suez -> Gulf -> Singapore
const proj = geoMercator().center([55, 32.4]).scale(448).translate([W / 2, H / 2])
const path = geoPath(proj)

// clip: d3 mercator renders whole world; we rely on SVG viewBox cropping.
const landPath = path(land)

const r1 = n => Math.round(n * 10) / 10
const pt = ([lon, lat]) => proj([lon, lat]).map(r1)

const ports = [
  { name: 'ROTTERDAM', lonlat: [4.1, 51.95] },
  { name: 'ANTWERP', lonlat: [4.3, 51.3] },
  { name: 'HAMBURG', lonlat: [9.95, 53.55] },
  { name: 'JEBEL ALI · DUBAI', lonlat: [55.05, 25.0] },
  { name: 'SINGAPORE', lonlat: [103.85, 1.29] },
].map(p => ({ name: p.name, xy: pt(p.lonlat) }))

// vessel routes as real-world waypoints (last point = destination port)
const routes = {
  '1': { // Adriatic Pioneer -> Rotterdam via English Channel
    wp: [[-16, 46.5], [-7, 48.8], [-1.5, 50.2], [1.6, 51.1], [4.1, 51.95]],
    frac: 0.78,
  },
  '2': { // Pacific Endeavour -> Singapore via South China Sea
    wp: [[113.5, 9.5], [109.5, 5.2], [105.8, 2.2], [103.85, 1.29]],
    frac: 0.5,
  },
  '3': { // Nordic Resolve -> Hamburg via German Bight
    wp: [[3.6, 56.6], [6.4, 55.2], [7.9, 54.3], [9.95, 53.55]],
    frac: 0.45,
  },
  '4': { // Strait Albatross -> Antwerp from Biscay via Ushant
    wp: [[-9.5, 44.2], [-5.5, 48.4], [-0.5, 49.9], [2.8, 51.0], [4.3, 51.3]],
    frac: 0.28,
  },
  '5': { // Coral Meridian -> Dubai via Gulf of Oman & Hormuz
    wp: [[66.5, 15.5], [60.8, 22.2], [57.4, 25.2], [56.4, 26.6], [55.05, 25.0]],
    frac: 0.32,
  },
}

function routeData(r) {
  const pts = r.wp.map(pt)
  const d = pts.map((p, i) => (i === 0 ? `M${p[0]} ${p[1]}` : `L${p[0]} ${p[1]}`)).join(' ')
  // vessel position at fraction of total polyline length + local heading
  const segs = []
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    const len = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
    segs.push({ a: pts[i - 1], b: pts[i], len })
    total += len
  }
  let want = total * r.frac
  for (const s of segs) {
    if (want <= s.len) {
      const t = want / s.len
      const x = r1(s.a[0] + (s.b[0] - s.a[0]) * t)
      const y = r1(s.a[1] + (s.b[1] - s.a[1]) * t)
      const heading = r1((Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0]) * 180) / Math.PI)
      return { d, x, y, heading }
    }
    want -= s.len
  }
  const last = pts[pts.length - 1]
  return { d, x: last[0], y: last[1], heading: 0 }
}

const vesselGeo = Object.fromEntries(Object.entries(routes).map(([id, r]) => [id, routeData(r)]))

// graticule every 15 deg with edge labels
const lons = [-15, 0, 15, 30, 45, 60, 75, 90, 105, 120]
const lats = [0, 15, 30, 45, 60]
const graticule = {
  v: lons.map(lon => ({ x: r1(proj([lon, 0])[0]), label: lon === 0 ? '0°' : `${Math.abs(lon)}°${lon > 0 ? 'E' : 'W'}` })).filter(g => g.x > 8 && g.x < W - 8),
  h: lats.map(lat => ({ y: r1(proj([0, lat])[1]), label: lat === 0 ? '0°' : `${lat}°N` })).filter(g => g.y > 8 && g.y < H - 8),
}

// key chokepoints for chart flavor
const marks = [
  { name: 'SUEZ', xy: pt([32.35, 30.6]) },
  { name: 'HORMUZ', xy: pt([56.3, 26.7]) },
  { name: 'MALACCA', xy: pt([100.5, 3.6]) },
]

const out = `// ═══════════════════════════════════════════════════════════════════════════
//  Real-world chart geometry for the CommandDeck fleet map.
//  Generated from Natural Earth 110m land polygons (public domain) with a
//  Mercator projection centered on the Europe–Suez–Singapore trade lane.
//  Regenerate: scratchpad mapgen/gen.mjs
// ═══════════════════════════════════════════════════════════════════════════

export const MAP_W = ${W}
export const MAP_H = ${H}

export const LAND_PATH = ${JSON.stringify(landPath)}

export interface PortMark { name: string; x: number; y: number }
export const PORTS: PortMark[] = ${JSON.stringify(ports.map(p => ({ name: p.name, x: p.xy[0], y: p.xy[1] })), null, 2)}

export interface VesselGeo { d: string; x: number; y: number; heading: number }
export const VESSEL_GEO: Record<string, VesselGeo> = ${JSON.stringify(vesselGeo, null, 2)}

export const GRATICULE = ${JSON.stringify(graticule, null, 2)}

export const CHOKEPOINTS: PortMark[] = ${JSON.stringify(marks.map(m => ({ name: m.name, x: m.xy[0], y: m.xy[1] })), null, 2)}
`
writeFileSync('/Users/marcoli/github/matsu-site/src/components/mapGeo.ts', out)
console.log('written; land path chars:', landPath.length)
console.log('ports:', ports.map(p => `${p.name}@${p.xy}`).join('  '))
console.log('vessels:', Object.entries(vesselGeo).map(([k, v]) => `${k}@${v.x},${v.y}`).join('  '))
