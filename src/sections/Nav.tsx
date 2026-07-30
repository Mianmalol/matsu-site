import { useScrollY } from '@/lib/hooks'
import { Wordmark } from '@/components/ui'
import { Link } from '@/lib/router'
import { DEMO_MAILTO } from '@/data'

// ═══════════════════════════════════════════════════════════════════════════
//  Navigation
//
//  Two distinct intents, two controls. "Book a demo" reaches a human by email.
//  "Sign in" goes to the product. Overloading one button for both was the
//  earlier mistake.
//
//  The bar is transparent over the hero and navy once scrolled, so both need
//  to stay legible in either state.
// ═══════════════════════════════════════════════════════════════════════════

export default function Nav() {
  const y = useScrollY()
  const scrolled = y > 40
  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-navy/85 backdrop-blur-md border-b border-white/10' : 'bg-transparent'}`}>
      <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#top" aria-label="Matsu home"><Wordmark light={scrolled} /></a>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            to="/sign-in"
            className={`text-[13px] font-medium transition-colors ${scrolled ? 'text-mist/80 hover:text-white' : 'text-navy/70 hover:text-navy'}`}
          >
            Sign in
          </Link>
          <a
            href={DEMO_MAILTO}
            className={`text-[13px] font-semibold px-4 sm:px-5 py-2.5 rounded-md transition-all ${scrolled ? 'bg-ocean text-white hover:bg-maritime' : 'bg-navy text-white hover:bg-deepsea'}`}
          >
            Book a demo
          </a>
        </div>
      </div>
    </nav>
  )
}
