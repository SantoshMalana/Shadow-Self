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
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', fontFamily: 'Inter, sans-serif' }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 32px', borderBottom: '1px solid #151515'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px', fontWeight: '600', color: '#f0f0f0', letterSpacing: '-0.02em' }}>
            Shadow Shelf
          </span>
          <span style={{
            fontSize: '10px', fontWeight: '500', color: '#444', background: '#151515',
            border: '1px solid #222', borderRadius: '4px', padding: '2px 8px', letterSpacing: '0.08em'
          }}>
            BETA
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: ollamaRunning === true ? '#22c55e' : ollamaRunning === false ? '#ef4444' : '#444',
            display: 'inline-block'
          }} />
          <span style={{ fontSize: '12px', color: '#555' }}>
            {ollamaRunning === true ? 'Ollama online' : ollamaRunning === false ? 'Ollama offline' : 'Checking…'}
          </span>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center', padding: '80px 24px',
        opacity: mounted ? 1 : 0, transition: 'opacity 0.6s ease'
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '6px 14px', borderRadius: '100px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '36px'
        }}>
          <span style={{ fontSize: '14px' }}>◈</span>
          <span style={{ fontSize: '12px', color: '#888', letterSpacing: '0.04em' }}>Cognitive Legacy Platform</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: '700', color: '#f0f0f0',
          letterSpacing: '-0.03em', lineHeight: '1.1', maxWidth: '800px',
          marginBottom: '24px'
        }}>
          The people who shape us<br />
          <span style={{ color: '#555' }}>shouldn't have to disappear.</span>
        </h1>

        <p style={{
          fontSize: '18px', color: '#666', maxWidth: '520px', lineHeight: '1.7',
          marginBottom: '48px', fontWeight: '400'
        }}>
          Shadow Shelf creates a living AI clone — your thinking style, personality,
          and emotional depth. Train it while you're here.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/signup" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '14px 28px', borderRadius: '12px',
            background: '#f0f0f0', color: '#0a0a0a',
            fontWeight: '600', fontSize: '15px', textDecoration: 'none',
            transition: 'background 0.15s ease'
          }}>
            Create your Clone
            <span>→</span>
          </Link>
          <Link href="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '14px 28px', borderRadius: '12px',
            background: 'transparent', color: '#f0f0f0',
            fontWeight: '500', fontSize: '15px', textDecoration: 'none',
            border: '1px solid #222', transition: 'border-color 0.15s ease'
          }}>
            Sign In
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section style={{ borderTop: '1px solid #151515', padding: '64px 32px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '12px', color: '#444', letterSpacing: '0.1em', textAlign: 'center', marginBottom: '40px' }}>HOW IT WORKS</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {[
              { step: '01', label: 'Train', desc: 'Answer daily questions. Share how you think, decide, and feel. Every answer deepens your clone.' },
              { step: '02', label: 'Process', desc: 'Extracts core values, communication styles, and emotional triggers into a cognitive profile via local AI.' },
              { step: '03', label: 'Clone', desc: 'Talk to your AI clone — voice-to-voice, in your style, with your opinions and emotional depth.' }
            ].map((item) => (
              <div key={item.step} style={{
                padding: '24px', borderRadius: '12px',
                background: '#0e0e0e', border: '1px solid #191919'
              }}>
                <div style={{ fontSize: '11px', color: '#333', marginBottom: '12px', letterSpacing: '0.08em' }}>{item.step}</div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#e0e0e0', marginBottom: '8px' }}>{item.label}</h3>
                <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px', textAlign: 'center', borderTop: '1px solid #111' }}>
        <p style={{ fontSize: '12px', color: '#333' }}>Shadow Shelf · Built by Santosh · phi3:mini + nomic-embed-text</p>
      </footer>
    </main>
  )
}
