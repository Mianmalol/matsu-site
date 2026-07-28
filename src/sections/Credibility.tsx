import { Reveal, Label, CountUp } from '@/components/ui'

// ═══════════════════════════════════════════════════════════════════════════
//  10 · Industry credibility
// ═══════════════════════════════════════════════════════════════════════════

export default function Credibility() {
  // Figures verified July 2026: FuelEU Maritime binding since Jan 2025, first
  // penalties issued from June 2026; EU ETS maritime coverage stepped
  // 40% (2024) → 70% (2025) → 100% (2026); IMO CII reduction factor 11% in
  // 2026; IMO 2023 GHG Strategy targets net-zero "by or around" 2050.
  const nums = [
    { n: 100, s: '%', label: 'EU ETS coverage of in-scope voyage emissions since January 2026' },
    { n: 2, s: '%', label: 'GHG-intensity cut FuelEU Maritime enforces today. Penalties live since June 2026' },
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
            FuelEU penalties are live. EU ETS reached full coverage. CII tightens every year. Most fleets still track all of this in spreadsheets and inboxes.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
