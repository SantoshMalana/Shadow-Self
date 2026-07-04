'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Signature Mechanic: Moving Light Source
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const maxScroll = document.body.scrollHeight - window.innerHeight
      const scrollPct = maxScroll > 0 ? scrollY / maxScroll : 0

      // The light source moves from top to bottom
      const yOffset = 4 + (scrollPct * 20)
      const blur = 12 + (scrollPct * 24)
      
      document.documentElement.style.setProperty('--shadow-y', `${yOffset}px`)
      document.documentElement.style.setProperty('--shadow-blur', `${blur}px`)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMounted(true)
    if (document.cookie.includes('sb-') && document.cookie.includes('-auth-token')) {
      router.push('/train')
    } else {
      setCheckingAuth(false)
    }
  }, [router])

  if (checkingAuth) return null

  return (
    <main className="min-h-screen flex flex-col bg-bg text-text-primary font-sans relative selection:bg-accent-cold selection:text-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-8 z-10">
        <div className="flex items-center">
          <span className="font-sans font-semibold text-xl tracking-wide text-text-primary">
            Shadow Shelf
          </span>
        </div>
      </nav>

      {/* Hero — The Thesis */}
      <section className={`flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-32 z-10 transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* The Failure Archive Box */}
        <div className="w-full max-w-2xl flex flex-col gap-4 mb-20 dynamic-shadow bg-surface p-8 sm:p-12 border border-[#2A2630] rounded-sm">
          <span className="text-[11px] font-mono text-text-muted uppercase tracking-widest mb-2 font-semibold">
            A senior engineer's debugging session, playing out live:
          </span>
          
          <div className="flex flex-col gap-4 font-mono text-[13px] sm:text-[15px]">
            <div className="text-text-muted line-through opacity-80">
              → checked the cache layer
            </div>
            <div className="text-text-muted line-through opacity-80">
              → rolled back the deploy
            </div>
            
            {/* The Resolution */}
            <div className="text-accent-brass font-medium flex items-center gap-2 mt-2">
              <span className="text-accent-brass">→</span> it was the auth token TTL
            </div>
          </div>
        </div>

        {/* The Wedge */}
        <h1 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.15] max-w-4xl text-center text-text-primary mb-12">
          We learn how you actually debug,<br />
          including the wrong turns.
        </h1>

        {/* CTAs - Added inline-flex and proper padding/margins */}
        <div className="flex flex-wrap gap-6 justify-center">
          <Link href="/signup" className="dynamic-shadow inline-flex items-center justify-center px-10 py-4 bg-accent-brass text-[#17161B] font-sans font-semibold text-sm transition-transform hover:scale-[1.02] active:scale-95 rounded-sm">
            Start
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center px-10 py-4 bg-transparent text-text-primary font-sans font-medium text-sm border border-text-muted/40 hover:border-text-primary transition-colors active:scale-95 rounded-sm">
            Sign In
          </Link>
        </div>
      </section>

      {/* The Architecture */}
      <section className="py-24 sm:py-32 px-6 sm:px-8 z-10 bg-surface border-t border-[#2A2630]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {[
              { step: '01', label: 'Living', desc: 'Answer daily prompts. Share exactly how you think, decide, and debug. The system observes your raw process.' },
              { step: '02', label: 'Deployment', desc: 'Extracts core values and logic into a cognitive profile via supervised local AI, tagging every inference.' },
              { step: '03', label: 'Posthumous', desc: 'A functional clone that retains your architectural instincts and emotional depth, locked to verifiable truths.' }
            ].map((item) => (
              <div key={item.step} className="dynamic-shadow p-8 sm:p-10 bg-bg border border-[#2A2630] rounded-sm flex flex-col h-full">
                <div className="font-mono text-[11px] font-semibold text-accent-cold mb-6">{item.step}</div>
                <h3 className="font-display text-2xl text-text-primary mb-4">{item.label}</h3>
                <p className="font-sans text-[15px] text-text-muted leading-relaxed flex-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 text-center z-10 bg-surface">
        <p className="font-mono text-xs text-text-muted">
          Shadow Shelf · Cognitive Trace
        </p>
      </footer>
    </main>
  )
}
