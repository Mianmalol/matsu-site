import { Wordmark } from '@/components/ui'
import { CONTACT_EMAIL } from '@/data'
import { Link } from '@/lib/router'

// ═══════════════════════════════════════════════════════════════════════════
//  Footer
// ═══════════════════════════════════════════════════════════════════════════

export default function Footer() {
  const cols: { h: string; l: [string, string][] }[] = [
    {
      h: 'Get in touch',
      l: [['Open the demo', '/demo'], ['Contact', `mailto:${CONTACT_EMAIL}`]],
    },
  ]
  return (
    <footer id="company" className="bg-abyss border-t border-white/8">
      <div className="max-w-[1280px] mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 mb-14">
          <div className="col-span-2">
            <Wordmark light />
            <p className="mt-4 text-sm text-steel leading-relaxed max-w-xs">
              AI Agents for Maritime Compliance
            </p>
          </div>
          {cols.map(c => (
            <div key={c.h}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mist/70 mb-4">{c.h}</p>
              <ul className="space-y-2.5">
                {c.l.map(([x, h]) => (
                  <li key={x}>
                    <Link to={h} className="text-[13px] text-steel hover:text-mist transition-colors">{x}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/8 pt-7">
          <span className="text-xs text-steel/70 font-mono">© 2026 MATSU AI</span>
        </div>
      </div>
    </footer>
  )
}
