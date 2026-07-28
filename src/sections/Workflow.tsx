import { Reveal, Label } from '@/components/ui'
import { workflow } from '@/data'

// ═══════════════════════════════════════════════════════════════════════════
//  6 · Workflow
// ═══════════════════════════════════════════════════════════════════════════

export default function Workflow() {
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
        <div className="mt-16 grid md:grid-cols-6 gap-y-8 md:gap-0">
          {workflow.map((w, i) => (
            <Reveal key={w.step} delay={i * 110} className="relative">
              <div className="md:px-2">
                <div className="flex items-center gap-3 md:block">
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-mist text-maritime text-[13px] font-bold md:mb-4">{i + 1}</span>
                  {i < workflow.length - 1 && (
                    <span className="hidden md:block absolute top-[18px] left-[44px] right-[-8px] h-px bg-ocean/40" aria-hidden="true" />
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
