'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const [ollamaRunning, setOllamaRunning] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetch('/api/health')
      .then(r => r.json())
      .then(data => setOllamaRunning(data.running))
      .catch(() => setOllamaRunning(false))
  }, [])

  return (
    <main className="min-h-screen flex flex-col bg-[#050505] text-white font-sans relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-black/40 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight text-white/90">
            Shadow Shelf
          </span>
          <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-900 border border-neutral-800 rounded px-2 py-0.5 tracking-widest">
            BETA
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)] ${
            ollamaRunning === true ? 'bg-green-400' : ollamaRunning === false ? 'bg-red-400' : 'bg-neutral-500'
          }`} />
          <span className="text-xs font-medium text-neutral-400">
            {ollamaRunning === true ? 'Inference Online' : ollamaRunning === false ? 'Inference Offline' : 'Checking…'}
          </span>
        </div>
      </nav>

      {/* Hero */}
      <section className={`flex-1 flex flex-col items-center justify-center text-center px-6 py-20 z-10 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm hover:bg-white/10 transition-colors">
          <span className="text-blue-400 text-sm">◈</span>
          <span className="text-xs font-medium text-neutral-300 tracking-wider uppercase">Cognitive Legacy Platform</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.1] max-w-4xl mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
          The people who shape us<br />
          <span className="text-neutral-500">shouldn't have to disappear.</span>
        </h1>

        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl leading-relaxed mb-12 font-light">
          Shadow Shelf creates a living AI clone — capturing your thinking style, personality,
          and emotional depth. Train it while you're here.
        </p>

        {/* CTAs */}
        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/signup" className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-black font-semibold text-sm overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.15)]">
            <span className="relative z-10">Create your Clone</span>
            <span className="relative z-10 transition-transform group-hover:translate-x-1">→</span>
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-transparent text-white font-medium text-sm border border-white/20 transition-all hover:bg-white/5 hover:border-white/40 active:scale-95">
            Sign In
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/5 py-24 px-8 bg-black/40 z-10">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-neutral-500 tracking-[0.2em] text-center mb-12">HOW IT WORKS</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', label: 'Train', desc: 'Answer daily questions. Share how you think, decide, and feel. Every answer deepens your clone.' },
              { step: '02', label: 'Process', desc: 'Extracts core values, communication styles, and emotional triggers into a cognitive profile via local AI.' },
              { step: '03', label: 'Clone', desc: 'Talk to your AI clone — voice-to-voice, in your style, with your opinions and emotional depth.' }
            ].map((item, i) => (
              <div key={item.step} className="group p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 hover:-translate-y-1">
                <div className="text-xs font-bold text-neutral-600 mb-6 tracking-widest">{item.step}</div>
                <h3 className="text-lg font-semibold text-white/90 mb-3 group-hover:text-blue-400 transition-colors">{item.label}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-white/5 z-10 bg-black/60">
        <p className="text-xs text-neutral-600 font-medium">Shadow Shelf · Built by Santosh · phi3:mini + nomic-embed-text</p>
      </footer>
    </main>
  )
}

