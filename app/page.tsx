'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [chatStep, setChatStep] = useState(0)
  
  useEffect(() => {
    setMounted(true)
    if (document.cookie.includes('sb-') && document.cookie.includes('-auth-token')) {
      router.push('/train')
    } else {
      setCheckingAuth(false)
    }
  }, [router])

  useEffect(() => {
    if (!mounted || checkingAuth) return

    const sequence = [
      { step: 1, delay: 600 },
      { step: 2, delay: 1800 },
      { step: 3, delay: 3800 },
      { step: 4, delay: 6000 },
      { step: 0, delay: 9500 }
    ]

    const runSequence = () => {
      setChatStep(0)
      const timeouts = sequence.map(({ step, delay }) => 
        setTimeout(() => setChatStep(step), delay)
      )
      return timeouts
    }

    let currentTimeouts = runSequence()
    const interval = setInterval(() => {
      currentTimeouts = runSequence()
    }, 9500)

    return () => {
      clearInterval(interval)
      currentTimeouts.forEach(clearTimeout)
    }
  }, [mounted, checkingAuth])

  if (checkingAuth) return null

  return (
    <>
      {/* NAV */}
      <nav className="ssNav">
        <div className="wrap">
          <div className="logo">
            <span className="logoMark" />
            <span className="logoText">Shadow Shelf</span>
            <span className="betaTag">BETA</span>
          </div>
          <div className="navLinks">
            <a href="#how">How it works</a>
            <a href="#about">About</a>
            <Link href="/login" className="text-text-muted hover:text-white">Sign in</Link>
            <Link href="/signup" className="btnPill">Create your clone</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="heroSection ambient-mesh" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 1s' }}>
        <div className="wrap">
          <span className="eyebrow">For Engineers Who Think For a Living</span>
          <h1 className="starkHeading">Your reasoning took years to build. Don't let a generic AI flatten it.</h1>
          <p className="heroSub">
            Generic AI is trained by crowds to be harmless and boring. Shadow Shelf is a cognitive clone trained by <i>you</i>. We capture your precise reasoning, debate style, and actual expertise — so you don't have to explain yourself twice.
          </p>
          <div className="heroActions">
            <Link href="/signup" className="btnPrimaryLg">Create your clone</Link>
            <Link href="/login" className="btnSecondary">Sign in</Link>
          </div>

          {/* CHAT MOCKUP */}
          <div className="chatCard">
            <div className="chatHead">
              <span className="chatAvatar" />
              <span className="chatName">Your clone</span>
              <span className="chatStatus"><span className="chatDot" /> trained on 42 days</span>
            </div>
            <div className="chatBody">
              {chatStep >= 1 && (
                <div className={`bubble user`}>Hey, the new microservice is throwing intermittent 502s under load. Thoughts?</div>
              )}
              {chatStep === 2 && (
                <div className={`bubble typing`}>
                   <span className="typingCursor" />
                </div>
              )}
              {chatStep >= 3 && (
                <div className={`bubble clone`}>We saw this in Q3 last year. Before you dig into the ingress logs, check if the connection pool on the db side is maxing out. It usually cascades from there.</div>
              )}
              {chatStep >= 4 && (
                <div className={`bubble user2`}>Spot on. It was the db pool.</div>
              )}
            </div>
            <div className="chatInputMock">
              <span>Ask your clone anything…</span>
              <span className="chatSend">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section id="how" className="ssSection">
        <div className="wrap">
          <div className="sectionHead">
            <span className="sectionLabel">How it works</span>
            <h2 className="sectionTitle">Three simple steps.</h2>
          </div>
          <div className="bentoGrid">
            {[
              { num: '1', title: 'Talk', desc: 'Have natural conversations. Share how you debug, decide, and think through problems — a few minutes a day is enough.' },
              { num: '2', title: 'Learn', desc: 'The system extracts your reasoning patterns, communication style, values, and opinions into a structured cognitive profile that grows over time.' },
              { num: '3', title: 'Clone', desc: 'Talk to your cognitive twin. It responds in your voice, your tone, with your actual opinions — grounded in real memories, not guesses.' },
            ].map(s => (
              <div key={s.num} className={`bentoCard sharpCard`}>
                <div className="bentoIcon font-bold text-lg">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT IS SHADOW SHELF */}
      <section id="about" className="ssSection">
        <div className="wrap">
          <div className="sectionHead" style={{ maxWidth: 640 }}>
            <span className="sectionLabel">What is Shadow Shelf?</span>
            <h2 className="sectionTitle" style={{ marginBottom: 24 }}>The journey matters more than the answer.</h2>
            <p className="sectionSub">
              Every AI model on earth is trained on final answers — Stack Overflow posts, Wikipedia articles, published papers. But the most valuable knowledge lives in the journey: the wrong turns, the hunches, the "I've seen this before" moments. Shadow Shelf captures that process through natural conversation, building the only AI that knows how you actually think.
            </p>
          </div>
          <div className="bentoGrid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {[
              { 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, 
                title: 'Dynamic Clone Routing', 
                desc: 'Why rely on a single generic model? Route specific architectural queries directly to a specialized Senior Engineer clone. Infinite depth, zero bloat.' 
              },
              { 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>, 
                title: 'Deep Intuition Training', 
                desc: "We don't rely on simple Yes/No RLHF. Our Track B training pipeline captures the exact intuition, edge cases, and reasoning frameworks of your domain experts." 
              },
              { 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>, 
                title: 'Infinite Vector Memory', 
                desc: 'Every meaningful conversation is embedded into a high-dimensional vector space. Your clone never forgets a project detail, a preferred tool, or a past mistake.' 
              },
              { 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, 
                title: 'Zero-Trust Data', 
                desc: 'Your data is strictly siloed. Train on your internal knowledge base without leaking intellectual property to public models. Delete everything instantly.' 
              },
            ].map((f, i) => (
              <div key={i} className={`bentoCard sharpCard`} style={{ flexDirection: 'row', gap: '24px', padding: '32px' }}>
                <div className="bentoIcon" style={{ marginBottom: 0, flexShrink: 0, width: '56px', height: '56px' }}>{f.icon}</div>
                <div>
                  <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>{f.title}</h3>
                  <p style={{ fontSize: '14px' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="ssSection">
        <div className="wrap">
          <div className="sectionHead">
            <span className="sectionLabel">Who is this for?</span>
            <h2 className="sectionTitle">Built for people who think for a living.</h2>
          </div>
          <div className="bentoGrid">
            {[
              { 
                title: 'Engineers & Architects', 
                desc: 'Preserve the debugging instincts and architectural decisions that take years to develop. Your team can query your reasoning long after you move on.', 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 7 3-3 3 3-3 3-3-3Z"/><path d="M14 7V3h7v4"/><path d="M10 14 3 21"/><path d="m3 14 7 7"/></svg>
              },
              { 
                title: 'Founders & Leaders', 
                desc: 'Capture the decision-making framework that defines your company culture. New hires learn from how you actually think, not just what you wrote in a doc.', 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              },
              { 
                title: 'Everyone, Eventually', 
                desc: 'The people who raised you. The mentor who shaped your career. A version of them that can still answer questions — built on real conversations, not guesses.', 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              },
            ].map((c, i) => (
              <div key={i} className={`bentoCard sharpCard`}>
                <div className="bentoIcon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="ssSection">
        <div className="wrap">
          <div className="sectionHead">
            <span className="sectionLabel">Trust & Transparency</span>
            <h2 className="sectionTitle">No black boxes.</h2>
          </div>
          <div className="bentoGrid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { label: 'Every inference tagged', desc: 'You see exactly what the model extracted and why.' },
              { label: 'Corrections built in', desc: 'Disagree with the clone? Correct it. The profile updates.' },
              { label: 'Depth tracking', desc: '5-rung trust system. Deeper questions unlock only with time.' },
              { label: 'You own the data', desc: 'Export or delete your cognitive trace at any time.' },
            ].map((t, i) => (
              <div key={i} className={`bentoCard sharpCard`} style={{ padding: '32px 24px', textAlign: 'center', alignItems: 'center' }}>
                <div className="bentoIcon" style={{ width: '40px', height: '40px', fontSize: '14px', fontWeight: 700 }}>{i + 1}</div>
                <h3 style={{ fontSize: '15px', marginBottom: '8px' }}>{t.label}</h3>
                <p style={{ fontSize: '14px' }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JARVIS MODE — VS Code Extension Download */}
      <section className="ssSection" style={{ borderTop: '1px solid var(--color-border)', backgroundColor: '#050505' }}>
        <div className="wrap">
          <div className="sectionHead">
            <span className="sectionLabel">Jarvis Mode</span>
            <h2 className="sectionTitle">Your AI watches while you work.</h2>
            <p className="sectionSub" style={{ maxWidth: 640, margin: '24px auto 64px' }}>
              Install the Shadow Shelf VS Code Extension. It silently watches your editor —
              idle patterns, file hops, terminal errors — and only speaks up when it's
              genuinely confident it can help. No pop-ups. No noise.
            </p>
          </div>

          <div className="bentoGrid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '64px' }}>
            {[
              { 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h3l3 -9 5 18 3 -9h5"/></svg>, 
                label: 'Silent by default', 
                desc: 'Tier 0 shadow mode — logs insights, never interrupts.' 
              },
              { 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4 -4"/><circle cx="12" cy="12" r="10"/></svg>, 
                label: '6-stage verification', 
                desc: 'Every intervention passes anomaly, boundary, vector search, and LLM self-critique before you see it.' 
              },
              { 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, 
                label: 'API key auth', 
                desc: "Your key lives in VS Code's encrypted SecretStorage. Never plain text." 
              },
              { 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>, 
                label: 'Earns trust over time', 
                desc: 'Scout advances from silent → gutter icon → voice only after proving accuracy.' 
              },
            ].map((f, i) => (
              <div key={i} className="sharpCard" style={{ padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="bentoIcon" style={{ width: '40px', height: '40px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-primary)' }}>{f.label}</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/shadow-shelf-0.1.0.vsix"
              download
              className="btnPrimaryLg"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}
            >
              <span>⬇</span> Download VS Code Extension
            </a>
            <Link href="/vscode-auth" className="btnSecondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '0 24px', height: '48px', borderRadius: '4px' }}>
              Connect VS Code →
            </Link>
          </div>

          <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '13px', color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)' }}>
            Download the .vsix file · Open VS Code · Press Ctrl+Shift+P → "Install from VSIX" · Click "Sign In" to connect instantly
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="ssSection">
        <div className="wrap">
          <div className="finalCta">
            <span className="sectionLabel">Ready when you are</span>
            <h2 className="sectionTitle" style={{ maxWidth: 640, margin: '0 auto 40px', fontSize: '32px' }}>
              Your first entry takes about four minutes.
            </h2>
            <Link href="/signup" className="btnPrimaryLg">Create your clone</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ssFooter">
        <div className="wrap">
          <span style={{ fontSize: '13px', color: 'var(--color-text-faint)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Shadow Shelf · Built by Santosh</span>
          <div className="footerLinks">
            <Link href="/train">Onboarding</Link>
            <Link href="/clone">Clone</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/login">Sign in</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
