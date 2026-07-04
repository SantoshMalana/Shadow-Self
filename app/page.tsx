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
      {/* Light rays — signature background element */}
      <div className="light-fx" aria-hidden="true">
        <div className="ray-source" />
        <div className="rays" />
      </div>

      {/* ========== NAV ========== */}
      <nav className="sticky top-0 z-50 bg-[rgba(7,4,13,0.85)] backdrop-blur-[10px] border-b border-border">
        <div className="max-w-[1040px] mx-auto px-7 flex items-center justify-between h-[68px]">
          <div className="flex items-center gap-[9px]">
            <span className="w-[26px] h-[26px] rounded-full shrink-0" style={{ background: 'radial-gradient(circle at 32% 28%, #ffffff, #c084fc 35%, #8328f9 78%)' }} />
            <span className="font-bold text-[16.5px] tracking-tight">Shadow Shelf</span>
            <span className="text-[9.5px] font-semibold tracking-wider text-accent-light bg-accent-soft px-[7px] py-[2px] rounded-full ml-1.5">BETA</span>
          </div>
          <div className="flex items-center gap-7">
            <a href="#how" className="hidden sm:inline text-sm text-text-muted hover:text-text-primary transition-colors no-underline">How it works</a>
            <a href="#about" className="hidden sm:inline text-sm text-text-muted hover:text-text-primary transition-colors no-underline">About</a>
            <Link href="/login" className="text-[14.5px] text-text-muted hover:text-text-primary transition-colors no-underline">Sign in</Link>
            <Link href="/signup" className="btn-pill">Create your clone</Link>
          </div>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <header className={`relative py-[88px] pb-10 text-center overflow-hidden transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-[1040px] mx-auto px-7 relative z-10">
          <span className="relative inline-block text-[13px] font-semibold text-accent-light bg-accent-soft px-4 py-1.5 rounded-full mb-[26px]">
            Cognitive Legacy Platform
          </span>

          <h1 className="relative text-[clamp(34px,5.2vw,54px)] font-bold tracking-tight leading-[1.12] max-w-[720px] mx-auto gradient-heading">
            The people who shape us shouldn't have to disappear.
          </h1>

          <p className="relative text-[17px] text-text-muted max-w-[520px] mx-auto mt-[22px] leading-[1.65]">
            Shadow Shelf builds a living AI clone from daily conversation — your thinking style, your voice, your opinions. Talk to it while you&apos;re here. Let others talk to it when you&apos;re not.
          </p>

          <div className="relative flex items-center justify-center gap-5 mt-8">
            <Link href="/signup" className="btn-primary-lg">Create your clone →</Link>
            <Link href="/login" className="btn-ghost">Sign in</Link>
          </div>

          {/* ========== CHAT MOCKUP ========== */}
          <div className="chat-mockup max-w-[520px] mx-auto mt-14 text-left">
            <div className="flex items-center gap-[10px] px-[18px] py-4 border-b border-border">
              <span className="w-7 h-7 rounded-full shrink-0" style={{ background: 'radial-gradient(circle at 32% 28%, #ffffff, #c084fc 35%, #8328f9 78%)' }} />
              <span className="font-semibold text-sm">Your clone</span>
              <span className="flex items-center gap-[5px] text-[11.5px] text-text-faint ml-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7fb069]" />
                trained on 42 days
              </span>
            </div>
            <div className="px-[18px] py-5 flex flex-col gap-3">
              <div className="self-end max-w-[78%] px-3.5 py-2.5 rounded-2xl rounded-br-sm bg-accent-soft text-text-primary text-sm leading-[1.5]">
                What would you tell me about taking the riskier job offer?
              </div>
              <div className="self-start max-w-[78%] px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-surface text-text-primary text-sm leading-[1.5]">
                Take it. You always regret the safe choice more once the boring version is actually living in front of you.
              </div>
              <div className="self-end max-w-[78%] px-3.5 py-2.5 rounded-2xl rounded-br-sm bg-accent-soft text-text-primary text-sm leading-[1.5]">
                That&apos;s exactly what I&apos;d say.
              </div>
            </div>
            <div className="flex items-center gap-[10px] mx-[18px] mb-[18px] px-4 py-[10px] border border-border rounded-full bg-bg">
              <span className="text-sm text-text-faint flex-1">Ask your clone anything…</span>
              <span className="w-[30px] h-[30px] rounded-full bg-accent flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how" className="py-20 relative z-10">
        <div className="max-w-[1040px] mx-auto px-7">
          <div className="text-center max-w-[520px] mx-auto mb-12">
            <span className="text-[13px] font-semibold text-accent-light block mb-3">How it works</span>
            <h2 className="text-[clamp(24px,3vw,32px)] font-bold tracking-tight">Three simple steps.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-border pt-16">
            {[
              { num: '1', title: 'Train', desc: 'Answer a few daily questions. Share how you think, decide, and feel — every answer deepens your clone.' },
              { num: '2', title: 'Process', desc: 'A local model extracts your values, communication style, and emotional triggers into a cognitive profile.' },
              { num: '3', title: 'Clone', desc: 'Talk to your clone voice-to-voice, in your style, with your opinions and emotional depth.' },
            ].map(s => (
              <div key={s.num} className="ss-card p-7">
                <div className="w-8 h-8 rounded-full bg-accent-soft text-accent-light flex items-center justify-center font-bold text-sm mb-[18px]">{s.num}</div>
                <h3 className="text-[17px] font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-text-muted leading-[1.65]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== ABOUT / WHAT IS SHADOW SHELF ========== */}
      <section id="about" className="py-20 relative z-10">
        <div className="max-w-[1040px] mx-auto px-7">
          <div className="text-center max-w-[580px] mx-auto mb-14">
            <span className="text-[13px] font-semibold text-accent-light block mb-3">What is Shadow Shelf?</span>
            <h2 className="text-[clamp(24px,3vw,32px)] font-bold tracking-tight mb-5">A cognitive trace, not a chatbot.</h2>
            <p className="text-[16px] text-text-muted leading-[1.7]">
              Most AI clones scrape your social media and guess. Shadow Shelf works differently — it sits with you, daily, learning the actual reasoning behind your decisions. The wrong turns you took while debugging. The values you&apos;d fight for. The tone you use when you&apos;re tired versus when you&apos;re sharp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: '🔒', title: 'Private by default', desc: 'Your data is processed locally first. We extract the cognitive profile — not raw transcripts.' },
              { icon: '🎙️', title: 'Your real voice', desc: 'Speaks in your cadence and phrasing — not a generic narrator reading a script.' },
              { icon: '⏱️', title: 'A few minutes a day', desc: 'No long intake forms. Small, daily answers are enough to start building depth.' },
              { icon: '🌱', title: 'Keeps learning', desc: 'There is no final version — your clone updates with every new conversation.' },
            ].map((f, i) => (
              <div key={i} className="flex gap-4 ss-card p-[22px]">
                <div className="w-9 h-9 rounded-full bg-accent-soft flex items-center justify-center text-[15px] shrink-0">{f.icon}</div>
                <div>
                  <h3 className="text-[15px] font-semibold mb-[5px]">{f.title}</h3>
                  <p className="text-[13.5px] text-text-muted leading-[1.6]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== USE CASES ========== */}
      <section className="py-20 relative z-10">
        <div className="max-w-[1040px] mx-auto px-7">
          <div className="text-center max-w-[580px] mx-auto mb-14">
            <span className="text-[13px] font-semibold text-accent-light block mb-3">Who is this for?</span>
            <h2 className="text-[clamp(24px,3vw,32px)] font-bold tracking-tight mb-5">Built for people who think for a living.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { title: 'Engineers & Architects', desc: 'Preserve the debugging instincts and architectural decisions that take years to develop. Your team can query your reasoning long after you move on.', icon: '⚙️' },
              { title: 'Founders & Leaders', desc: 'Capture the decision-making framework that defines your company culture. New hires learn from how you actually think, not just what you wrote in a doc.', icon: '🎯' },
              { title: 'Everyone, Eventually', desc: 'The people who raised you. The mentor who shaped your career. A version of them that can still answer questions — built on real conversations, not guesses.', icon: '💜' },
            ].map((c, i) => (
              <div key={i} className="ss-card p-7 flex flex-col">
                <div className="text-2xl mb-4">{c.icon}</div>
                <h3 className="text-[17px] font-semibold mb-2">{c.title}</h3>
                <p className="text-sm text-text-muted leading-[1.65] flex-1">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TRUST / TRANSPARENCY ========== */}
      <section className="py-20 relative z-10">
        <div className="max-w-[1040px] mx-auto px-7">
          <div className="text-center max-w-[520px] mx-auto mb-14">
            <span className="text-[13px] font-semibold text-accent-light block mb-3">Trust & Transparency</span>
            <h2 className="text-[clamp(24px,3vw,32px)] font-bold tracking-tight">No black boxes.</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Every inference tagged', desc: 'You see exactly what the model extracted and why.' },
              { label: 'Corrections built in', desc: 'Disagree with the clone? Correct it. The profile updates.' },
              { label: 'Depth tracking', desc: '5-rung trust system. Deeper questions unlock only with time.' },
              { label: 'You own the data', desc: 'Export or delete your cognitive trace at any time.' },
            ].map((t, i) => (
              <div key={i} className="ss-card p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-accent-soft text-accent-light flex items-center justify-center font-bold text-sm mx-auto mb-4">
                  {i + 1}
                </div>
                <h3 className="text-[14px] font-semibold mb-2">{t.label}</h3>
                <p className="text-[13px] text-text-muted leading-[1.6]">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="py-20 relative z-10">
        <div className="max-w-[1040px] mx-auto px-7">
          <div className="text-center ss-card p-16 sm:p-20 rounded-3xl" style={{ boxShadow: '0 30px 80px -32px rgba(0,0,0,0.6), 0 0 0 1px rgba(131,40,249,0.1)' }}>
            <span className="text-[13px] font-semibold text-accent-light block mb-3">Ready when you are</span>
            <h2 className="text-[clamp(24px,3vw,32px)] font-bold tracking-tight max-w-[460px] mx-auto mb-7">
              Your first entry takes about four minutes.
            </h2>
            <Link href="/signup" className="btn-primary-lg">Create your clone →</Link>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-border py-8 mt-5 relative z-10">
        <div className="max-w-[1040px] mx-auto px-7 flex justify-between items-center flex-wrap gap-3">
          <span className="text-[12.5px] text-text-faint">Shadow Shelf · Built by Santosh</span>
          <div className="flex gap-[22px]">
            <Link href="/train" className="text-[13px] text-text-faint hover:text-text-muted no-underline transition-colors">Onboarding</Link>
            <Link href="/clone" className="text-[13px] text-text-faint hover:text-text-muted no-underline transition-colors">Clone</Link>
            <Link href="/login" className="text-[13px] text-text-faint hover:text-text-muted no-underline transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
