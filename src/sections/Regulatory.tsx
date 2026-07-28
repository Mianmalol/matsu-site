import { Reveal, Label } from '@/components/ui'
import { regs } from '@/data'

// ═══════════════════════════════════════════════════════════════════════════
//  8 · Regulatory intelligence
// ═══════════════════════════════════════════════════════════════════════════

export default function Regulatory() {
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
