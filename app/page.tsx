'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)

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
    <>
      <div className="light-fx" aria-hidden="true">
        <div className="ray-source" />
        <div className="rays" />
      </div>

      {/* NAV */}
      <nav className="ss-nav">
        <div className="wrap">
          <div className="logo">
            <span className="logo-mark" />
            <span className="logo-text">Shadow Shelf</span>
            <span className="beta-tag">BETA</span>
          </div>
          <div className="nav-links">
            <a href="#how">How it works</a>
            <a href="#about">About</a>
            <Link href="/login">Sign in</Link>
            <Link href="/signup" className="btn-pill">Create your clone</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero-section" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 1s' }}>
        <div className="wrap">
          <span className="eyebrow">Cognitive Legacy Platform</span>
          <h1 className="gradient-heading">The people who shape us shouldn&apos;t have to disappear.</h1>
          <p className="hero-sub">
            Shadow Shelf builds a living AI clone from daily conversation — your thinking style, your voice, your opinions. Talk to it while you&apos;re here. Let others talk to it when you&apos;re not.
          </p>
          <div className="hero-actions">
            <Link href="/signup" className="btn-primary-lg">Create your clone →</Link>
            <Link href="/login" className="btn-ghost">Sign in</Link>
          </div>

          {/* CHAT MOCKUP */}
          <div className="chat-card">
            <div className="chat-head">
              <span className="chat-avatar" />
              <span className="chat-name">Your clone</span>
              <span className="chat-status"><span className="chat-dot" /> trained on 42 days</span>
            </div>
            <div className="chat-body">
              <div className="bubble user">What would you tell me about taking the riskier job offer?</div>
              <div className="bubble clone">Take it. You always regret the safe choice more once the boring version is actually living in front of you.</div>
              <div className="bubble user">That&apos;s exactly what I&apos;d say.</div>
            </div>
            <div className="chat-input-mock">
              <span>Ask your clone anything…</span>
              <span className="chat-send">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section id="how" className="ss-section">
        <div className="wrap">
          <div className="section-head">
            <span className="section-label">How it works</span>
            <h2 className="section-title">Three simple steps.</h2>
          </div>
          <div className="steps-grid">
            {[
              { num: '1', title: 'Train', desc: 'Answer a few daily questions. Share how you think, decide, and feel — every answer deepens your clone.' },
              { num: '2', title: 'Process', desc: 'A local model extracts your values, communication style, and emotional triggers into a cognitive profile.' },
              { num: '3', title: 'Clone', desc: 'Talk to your clone voice-to-voice, in your style, with your opinions and emotional depth.' },
            ].map(s => (
              <div key={s.num} className="step-card">
                <div className="step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT IS SHADOW SHELF */}
      <section id="about" className="ss-section">
        <div className="wrap">
          <div className="section-head" style={{ maxWidth: 580 }}>
            <span className="section-label">What is Shadow Shelf?</span>
            <h2 className="section-title" style={{ marginBottom: 20 }}>A cognitive trace, not a chatbot.</h2>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Most AI clones scrape your social media and guess. Shadow Shelf works differently — it sits with you, daily, learning the actual reasoning behind your decisions. The wrong turns you took while debugging. The values you&apos;d fight for. The tone you use when you&apos;re tired versus when you&apos;re sharp.
            </p>
          </div>
          <div className="features-grid">
            {[
              { icon: '🔒', title: 'Private by default', desc: 'Your data is processed locally first. We extract the cognitive profile — not raw transcripts.' },
              { icon: '🎙️', title: 'Your real voice', desc: 'Speaks in your cadence and phrasing — not a generic narrator reading a script.' },
              { icon: '⏱️', title: 'A few minutes a day', desc: 'No long intake forms. Small, daily answers are enough to start building depth.' },
              { icon: '🌱', title: 'Keeps learning', desc: 'There is no final version — your clone updates with every new conversation.' },
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-dot">{f.icon}</div>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="ss-section">
        <div className="wrap">
          <div className="section-head" style={{ maxWidth: 580 }}>
            <span className="section-label">Who is this for?</span>
            <h2 className="section-title">Built for people who think for a living.</h2>
          </div>
          <div className="use-cases-grid">
            {[
              { title: 'Engineers & Architects', desc: 'Preserve the debugging instincts and architectural decisions that take years to develop. Your team can query your reasoning long after you move on.', icon: '⚙️' },
              { title: 'Founders & Leaders', desc: 'Capture the decision-making framework that defines your company culture. New hires learn from how you actually think, not just what you wrote in a doc.', icon: '🎯' },
              { title: 'Everyone, Eventually', desc: 'The people who raised you. The mentor who shaped your career. A version of them that can still answer questions — built on real conversations, not guesses.', icon: '💜' },
            ].map((c, i) => (
              <div key={i} className="use-case-card">
                <div style={{ fontSize: 24, marginBottom: 16 }}>{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="ss-section">
        <div className="wrap">
          <div className="section-head">
            <span className="section-label">Trust & Transparency</span>
            <h2 className="section-title">No black boxes.</h2>
          </div>
          <div className="trust-grid">
            {[
              { label: 'Every inference tagged', desc: 'You see exactly what the model extracted and why.' },
              { label: 'Corrections built in', desc: 'Disagree with the clone? Correct it. The profile updates.' },
              { label: 'Depth tracking', desc: '5-rung trust system. Deeper questions unlock only with time.' },
              { label: 'You own the data', desc: 'Export or delete your cognitive trace at any time.' },
            ].map((t, i) => (
              <div key={i} className="trust-card">
                <div className="step-num" style={{ margin: '0 auto 16px' }}>{i + 1}</div>
                <h3>{t.label}</h3>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="ss-section">
        <div className="wrap">
          <div className="final-cta">
            <span className="section-label">Ready when you are</span>
            <h2 className="section-title" style={{ maxWidth: 460, margin: '0 auto 28px' }}>
              Your first entry takes about four minutes.
            </h2>
            <Link href="/signup" className="btn-primary-lg">Create your clone →</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ss-footer">
        <div className="wrap">
          <span style={{ fontSize: '12.5px', color: 'var(--text-faint)' }}>Shadow Shelf · Built by Santosh</span>
          <div className="footer-links">
            <Link href="/train">Onboarding</Link>
            <Link href="/clone">Clone</Link>
            <Link href="/login">Sign in</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
