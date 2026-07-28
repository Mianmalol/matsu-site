import { Reveal, Label } from '@/components/ui'
import { security } from '@/data'

// ═══════════════════════════════════════════════════════════════════════════
//  9 · Security and auditability
// ═══════════════════════════════════════════════════════════════════════════

export default function Security() {
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
