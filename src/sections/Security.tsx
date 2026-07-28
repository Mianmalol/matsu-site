import { Reveal, Label } from '@/components/ui'
import ComplianceLedger, { type LedgerRow } from '@/components/ComplianceLedger'
import { security } from '@/data'

// ═══════════════════════════════════════════════════════════════════════════
//  9 · Security and auditability
// ═══════════════════════════════════════════════════════════════════════════

export default function Security() {
  const trail: LedgerRow[] = [
    { t: '14:02:11Z', who: 'CHIEF OFFICER', e: 'Certificate uploaded — IOPP, MV Coral Meridian', verdict: 'VALID → 2027-03', cite: 'MARPOL I reg. 7' },
    { t: '14:02:38Z', who: 'MATSU ENGINE', e: 'Deterministic check — certificate window vs renewal survey cycle', verdict: 'PASS', cite: 'MARPOL I reg. 6' },
    { t: '14:03:02Z', who: 'MATSU ENGINE', e: 'GHG intensity computed — 88.9 vs 89.3 gCO₂e/MJ limit', verdict: 'PASS', cite: 'FuelEU Art. 4' },
    { t: '15:11:07Z', who: 'MASTER', e: 'Corrective action NC-014 marked complete', verdict: 'EVIDENCE ATTACHED', cite: 'ISM Code 9.2' },
    { t: '15:40:52Z', who: 'DPA', e: 'Evidence approved — audit record sealed', verdict: 'SEALED', cite: 'ISM Code 12' },
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
          <ComplianceLedger rows={trail} />
        </Reveal>
      </div>
    </section>
  )
}
