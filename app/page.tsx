'use client'

import { useEffect, useState, useRef } from 'react'
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
      <div className="lightFx" aria-hidden="true">
        <div className="raySource" />
        <div className="rays" />
      </div>

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
            <Link href="/login">Sign in</Link>
            <Link href="/signup" className="btnPill">Create your clone</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="heroSection" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 1s' }}>
        <div className="wrap">
          <span className="eyebrow">For Engineers Who Think For a Living</span>
          <h1 className="gradientHeading">Your debugging instinct took years to build. Don&apos;t let it disappear.</h1>
          <p className="heroSub">
            Shadow Shelf captures the reasoning journey behind your decisions — not just the final answer. Through daily conversations, it builds a cognitive clone that thinks like you, debates like you, and remembers what you&apos;d forget.
          </p>
          <div className="heroActions">
            <Link href="/signup" className="btnPrimaryLg">Create your clone →</Link>
            <Link href="/login" className="btnGhost">Sign in</Link>
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
                <div className={`bubble user`}>What would you tell me about taking the riskier job offer?</div>
              )}
              {chatStep === 2 && (
                <div className={`bubble clone typing`}>...</div>
              )}
              {chatStep >= 3 && (
                <div className={`bubble clone`}>Take it. You always regret the safe choice more once the boring version is actually living in front of you.</div>
              )}
              {chatStep >= 4 && (
                <div className={`bubble user2`}>That&apos;s exactly what I&apos;d say.</div>
              )}
            </div>
            <div className="chatInputMock">
              <span>Ask your clone anything…</span>
              <span className="chatSend">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
          <div className="stepsGrid">
            {[
              { num: '1', title: 'Talk', desc: 'Have natural conversations. Share how you debug, decide, and think through problems — a few minutes a day is enough.' },
              { num: '2', title: 'Learn', desc: 'The system extracts your reasoning patterns, communication style, values, and opinions into a structured cognitive profile that grows over time.' },
              { num: '3', title: 'Clone', desc: 'Talk to your cognitive twin. It responds in your voice, your tone, with your actual opinions — grounded in real memories, not guesses.' },
            ].map(s => (
              <div key={s.num} className={`stepCard glassCard`}>
                <div className="stepNum">{s.num}</div>
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
          <div className="sectionHead" style={{ maxWidth: 580 }}>
            <span className="sectionLabel">What is Shadow Shelf?</span>
            <h2 className="sectionTitle" style={{ marginBottom: 20 }}>The journey matters more than the answer.</h2>
            <p style={{ fontSize: 16, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
              Every AI model on earth is trained on final answers — Stack Overflow posts, Wikipedia articles, published papers. But the most valuable knowledge lives in the journey: the wrong turns, the hunches, the "I&apos;ve seen this before" moments. Shadow Shelf captures that process through natural conversation, building the only AI that knows how you actually think.
            </p>
          </div>
          <div className="featuresGrid">
            {[
              { icon: '🔒', title: 'Zero-Trust Architecture', desc: 'Your data is siloed to your account. We use vector embeddings — numerical representations, not raw text — for memory retrieval. You can delete everything at any time.' },
              { icon: '🧠', title: 'Learns the journey', desc: 'Captures the reasoning process behind decisions — the wrong turns, the tradeoffs, the intuition — not just the polished final answer.' },
              { icon: '🎙️', title: 'Your real voice', desc: 'Speaks in your cadence and phrasing. Debates in your style. Uses your actual vocabulary, not a generic AI tone.' },
              { icon: '🌱', title: 'Gets smarter daily', desc: 'Every conversation deepens the cognitive profile. There is no final version — your clone evolves as you do.' },
            ].map((f, i) => (
              <div key={i} className={`featureCard glassCard`}>
                <div className="featureDot">{f.icon}</div>
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
      <section className="ssSection">
        <div className="wrap">
          <div className="sectionHead" style={{ maxWidth: 580 }}>
            <span className="sectionLabel">Who is this for?</span>
            <h2 className="sectionTitle">Built for people who think for a living.</h2>
          </div>
          <div className="useCasesGrid">
            {[
              { title: 'Engineers & Architects', desc: 'Preserve the debugging instincts and architectural decisions that take years to develop. Your team can query your reasoning long after you move on.', icon: '⚙️' },
              { title: 'Founders & Leaders', desc: 'Capture the decision-making framework that defines your company culture. New hires learn from how you actually think, not just what you wrote in a doc.', icon: '🎯' },
              { title: 'Everyone, Eventually', desc: 'The people who raised you. The mentor who shaped your career. A version of them that can still answer questions — built on real conversations, not guesses.', icon: '💜' },
            ].map((c, i) => (
              <div key={i} className={`useCaseCard glassCard`}>
                <div style={{ fontSize: 24, marginBottom: 16 }}>{c.icon}</div>
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
          <div className="trustGrid">
            {[
              { label: 'Every inference tagged', desc: 'You see exactly what the model extracted and why.' },
              { label: 'Corrections built in', desc: 'Disagree with the clone? Correct it. The profile updates.' },
              { label: 'Depth tracking', desc: '5-rung trust system. Deeper questions unlock only with time.' },
              { label: 'You own the data', desc: 'Export or delete your cognitive trace at any time.' },
            ].map((t, i) => (
              <div key={i} className={`trustCard glassCard`}>
                <div className="stepNum" style={{ margin: '0 auto 16px' }}>{i + 1}</div>
                <h3>{t.label}</h3>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JARVIS MODE — VS Code Extension Download */}
      <section className="ssSection" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(99,102,241,0.05) 100%)' }}>
        <div className="wrap">
          <div className="sectionHead">
            <span className="sectionLabel">Jarvis Mode</span>
            <h2 className="sectionTitle">Your AI watches while you work.</h2>
            <p className="sectionSub" style={{ maxWidth: 560, margin: '0 auto 48px' }}>
              Install the Shadow Shelf VS Code Extension. It silently watches your editor —
              idle patterns, file hops, terminal errors — and only speaks up when it's
              genuinely confident it can help. No pop-ups. No noise.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '48px' }}>
            {[
              { icon: '🕵️', label: 'Silent by default', desc: 'Tier 0 shadow mode — logs insights, never interrupts.' },
              { icon: '🧠', label: '6-stage verification', desc: 'Every intervention passes anomaly, boundary, vector search, and LLM self-critique before you see it.' },
              { icon: '🔒', label: 'API key auth', desc: 'Your key lives in VS Code\'s encrypted SecretStorage. Never plain text.' },
              { icon: '📊', label: 'Earns trust over time', desc: 'Scout advances from silent → gutter icon → voice only after proving accuracy.' },
            ].map((f, i) => (
              <div key={i} className="glassCard" style={{ flex: '1 1 200px', maxWidth: 260, textAlign: 'center', padding: '28px 20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>{f.label}</h3>
                <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
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
            <Link href="/settings" className="btnGhost" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '0 24px', height: '48px', borderRadius: '24px' }}>
              Get your API Key →
            </Link>
          </div>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12.5px', color: 'var(--color-text-faint)' }}>
            Download the .vsix file · Open VS Code · Press Ctrl+Shift+P → "Install from VSIX" · Click "Sign In" to connect instantly
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="ssSection">
        <div className="wrap">
          <div className="finalCta">
            <span className="sectionLabel">Ready when you are</span>
            <h2 className="sectionTitle" style={{ maxWidth: 460, margin: '0 auto 28px' }}>
              Your first entry takes about four minutes.
            </h2>
            <Link href="/signup" className="btnPrimaryLg">Create your clone →</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ssFooter">
        <div className="wrap">
          <span style={{ fontSize: '12.5px', color: 'var(--color-text-faint)' }}>Shadow Shelf · Built by Santosh</span>
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
