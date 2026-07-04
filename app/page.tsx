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
      const yOffset = 8 + (scrollPct * 16) // 8px to 24px
      const blur = 24 + (scrollPct * 16) // 24px to 40px
      
      document.documentElement.style.setProperty('--shadow-y', `${yOffset}px`)
      document.documentElement.style.setProperty('--shadow-blur', `${blur}px`)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMounted(true)
    // Check if user is authenticated via cookie. Next.js App Router usually handles this better on the server,
    // but to prevent the layout collision during client-side hydration, we can quickly check cookies.
    if (document.cookie.includes('sb-') && document.cookie.includes('-auth-token')) {
      router.push('/train')
    } else {
      setCheckingAuth(false)
    }
  }, [router])

  if (checkingAuth) return null // Wait for client hydration to avoid flash of content if logged in

  return (
    <main className="min-h-screen flex flex-col bg-bg text-text-primary font-sans relative overflow-x-hidden selection:bg-accent-cold selection:text-white">
      {/* 
        NO gradient blobs, NO glassmorphism, NO neural-network-node iconography.
        The product is a shadow; it relies on a real light source.
      */}

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 z-10">
        <div className="flex items-center">
          <span className="font-display text-lg tracking-wide text-text-primary">
            Shadow Shelf
          </span>
        </div>
      </nav>

      {/* Hero — The Thesis */}
      <section className={`flex-1 flex flex-col items-center justify-center px-6 py-24 z-10 transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        
        <div className="w-full max-w-3xl flex flex-col items-start gap-3 mb-16 dynamic-shadow bg-surface p-10 border border-[#2A2630] rounded-sm">
          <span className="text-[10px] font-mono text-accent-cold uppercase tracking-widest mb-4">
            A senior engineer's debugging session, playing out live:
          </span>
          
          {/* The Failure Archive */}
          <div className="flex flex-col gap-3 font-mono text-sm">
            <div className="text-text-muted line-through opacity-70">
              → checked the cache layer
            </div>
            <div className="text-text-muted line-through opacity-70">
              → rolled back the deploy
            </div>
            
            {/* The Resolution */}
            <div className="text-accent-brass font-medium text-[15px] flex items-center gap-2">
              <span className="text-accent-brass">→</span> it was the auth token TTL
            </div>
          </div>
        </div>

        {/* The Wedge */}
        <h1 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.1] max-w-4xl text-center text-text-primary mb-12">
          We learn how you actually debug,<br />
          including the wrong turns.
        </h1>

        <div className="flex gap-6 justify-center">
          <Link href="/signup" className="dynamic-shadow px-8 py-4 bg-accent-brass text-[#17161B] font-sans font-medium text-sm transition-transform active:scale-95">
            Start
          </Link>
          <Link href="/login" className="px-8 py-4 bg-transparent text-text-primary font-sans font-medium text-sm border border-text-muted/30 hover:border-text-muted transition-colors active:scale-95">
            Sign In
          </Link>
        </div>
      </section>

      {/* The Architecture */}
      <section className="py-32 px-8 z-10 bg-[#121115]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', label: 'Living', desc: 'Answer daily prompts. Share exactly how you think, decide, and debug.' },
              { step: '02', label: 'Deployment', desc: 'Extracts core values and logic into a cognitive profile via supervised local AI.' },
              { step: '03', label: 'Posthumous', desc: 'A functional clone that retains your architectural instincts and emotional depth.' }
            ].map((item) => (
              <div key={item.step} className="dynamic-shadow p-10 bg-surface border border-[#2A2630]">
                <div className="font-mono text-[10px] text-accent-cold mb-6">{item.step}</div>
                <h3 className="font-display text-2xl text-text-primary mb-4">{item.label}</h3>
                <p className="font-sans text-sm text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center z-10 bg-[#121115] border-t border-[#1C1A21]">
        <p className="font-mono text-xs text-text-muted">
          Shadow Shelf · Cognitive Trace
        </p>
      </footer>
    </main>
  )
}
