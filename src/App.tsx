import Nav from '@/sections/Nav'
import Hero from '@/sections/Hero'
import Depths from '@/sections/Depths'
import CommandDeck from '@/sections/CommandDeck'
import Workflow from '@/sections/Workflow'
import Regulatory from '@/sections/Regulatory'
import Security from '@/sections/Security'
import Credibility from '@/sections/Credibility'
import Harbor from '@/sections/Harbor'
import Footer from '@/sections/Footer'

// ═══════════════════════════════════════════════════════════════════════════
//  App
// ═══════════════════════════════════════════════════════════════════════════

export default function App() {
  return (
    <div className="min-h-screen bg-white text-navy antialiased">
      <a href="#platform" className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:bg-white focus:text-navy focus:px-4 focus:py-2">
        Skip to platform overview
      </a>
      <Nav />
      <Hero />
      <Depths />
      <CommandDeck />
      <Workflow />
      <Regulatory />
      <Security />
      <Credibility />
      <Harbor />
      <Footer />
    </div>
  )
}
