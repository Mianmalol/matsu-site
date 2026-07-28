import { useScrollY } from '@/lib/hooks'
import { Wordmark } from '@/components/ui'

// ═══════════════════════════════════════════════════════════════════════════
//  Navigation
// ═══════════════════════════════════════════════════════════════════════════

export default function Nav() {
  const y = useScrollY()
  const scrolled = y > 40
  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-navy/85 backdrop-blur-md border-b border-white/10' : 'bg-transparent'}`}>
      <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#top" aria-label="Matsu home"><Wordmark light={scrolled} /></a>
        <a href="#cta" className={`text-[13px] font-semibold px-4 sm:px-5 py-2.5 rounded-md transition-all ${scrolled ? 'bg-ocean text-white hover:bg-maritime' : 'bg-navy text-white hover:bg-deepsea'}`}>
          Book a demo
        </a>
      </div>
    </nav>
  )
}
