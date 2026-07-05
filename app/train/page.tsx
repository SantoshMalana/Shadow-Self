'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ChatBubble from '@/components/ChatBubble'
import VoiceInput from '@/components/VoiceInput'
import PersonalityStats from '@/components/PersonalityStats'
import { getCloneCompleteness } from '@/lib/personality'
import { getDailyQuestion } from '@/lib/questions'
import { getUserState, updateUserName } from '@/app/actions/user'
import UserMenu from '@/components/UserMenu'

interface Message {
  role: 'user' | 'assistant'
  content: string
  turnGoal?: string
}

interface Personality {
  name?: string
  sessions: number
  updatedAt?: string
  voiceId?: string
  communicationStyle: any
  thinkingPatterns: any
  emotionalProfile: any
  knowledgeDomains: any
}

function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…'
}



export default function TrainPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [personality, setPersonality] = useState<Personality | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [userState, setUserState] = useState<{ id: string, name: string | null, depthRung: number, daysKnown: number } | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [nameSet, setNameSet] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [inputFocused, setInputFocused] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const unlockedRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio()
    }
  }, [])

  useEffect(() => {
    async function loadData() {
      try {
        const user = await getUserState()
        // FIX: a backend error is a distinct state, not a fake user name.
        // Previously this wrote "Database Connection Error" into `name`,
        // which UserMenu then rendered as if it were the person's name.
        if ('error' in user) {
          setLoadError(user.error)
          return
        }
        setUserState(user as any)
        if (user.name) {
          setNameSet(true)
          setNameInput(user.name)
        }
        try {
          const pData = await fetch('/api/personality').then(r => r.json())
          if (!pData.error) {
            setPersonality(pData)
            const q = getDailyQuestion(pData.sessions || 0, user.depthRung)
            setCurrentQuestion(q)
            setMessages([{ role: 'assistant', content: `Let's continue. Here's your next question:\n\n"${q}"`, turnGoal: 'establish_baseline' }])
          }
        } catch (e) {
          const q = getDailyQuestion(0, user.depthRung)
          setCurrentQuestion(q)
          setMessages([{ role: 'assistant', content: `Let's begin. Here's your first question:\n\n"${q}"`, turnGoal: 'establish_baseline' }])
        }
      } catch (err) {
        console.error("Failed to fetch user state", err)
        setLoadError('Unexpected error while loading your session.')
      } finally {
        // FIX: this used to never fire on the error path, so "Loading profile…"
        // stayed stuck (and pulsing) forever instead of resolving to any real state.
        setProfileLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  const speakText = async (text: string, voiceId?: string) => {
    if (!audioRef.current) return
    try {
      setSpeaking(true)
      const res = await fetch('/api/synthesize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId })
      })
      if (!res.ok) throw new Error('Synthesis failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = audioRef.current
      audio.src = url
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url) }
      audio.onerror = () => setSpeaking(false)
      await audio.play()
    } catch { setSpeaking(false) }
  }

  const saveName = async () => {
    if (!nameInput.trim()) return
    try {
      const result = await updateUserName(nameInput.trim())
      if ('error' in result) {
        setLoadError(result.error)
        return
      }
      setUserState(result as any)
      setNameSet(true)
      const q = getDailyQuestion(0, result.depthRung)
      setCurrentQuestion(q)
      const responseMsg = `Great, ${result.name}. Let's begin.\n\n"${q}"`
      setMessages([{ role: 'assistant', content: responseMsg, turnGoal: 'establish_baseline' }])
      if (voiceEnabled) speakText(responseMsg)
    } catch (err: any) {
      setLoadError(err.message || 'Unknown error while saving your name.')
    }
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    if (audioRef.current && !unlockedRef.current) {
      audioRef.current.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'
      audioRef.current.play().catch(() => {})
      unlockedRef.current = true
    }
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], mode: 'onboarding', question: currentQuestion })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, turnGoal: data.turnGoal }])
      const refreshedUser = await getUserState()
      if (!('error' in refreshedUser)) setUserState(refreshedUser as any)
      try {
        const updated = await fetch('/api/personality').then(r => r.json())
        if (!updated.error) {
          setPersonality(updated)
          const currentDepth = 'error' in refreshedUser ? (userState?.depthRung || 1) : refreshedUser.depthRung;
          setCurrentQuestion(getDailyQuestion(updated.sessions || 0, currentDepth))
        }
      } catch (e) { console.error("Failed to fetch updated personality", e) }
      if (voiceEnabled) speakText(data.response, personality?.voiceId)
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠ ${err.message || 'API Error'}` }])
    } finally { setLoading(false) }
  }

  const completeness = personality ? getCloneCompleteness(personality) : 0

  // FIX: a DB/session error now gets its own honest screen instead of
  // faking a user name and silently looping through the name gate.
  if (loadError) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-10 font-sans relative">
        <div className="text-center max-w-sm relative z-10">
          <div className="w-16 h-16 rounded-full mx-auto mb-6 bg-accent-soft flex items-center justify-center text-accent-light">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-text-primary">System Error</h2>
          <p className="text-sm text-text-muted leading-relaxed mb-8">
            {loadError}. Please check your database connection and try again.
          </p>
          <Link href="/" className="btn-primary-lg">← Back home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-bg font-sans text-sm relative overflow-hidden text-text-primary">

      {/* Left Sidebar */}
      {nameSet && (
        <aside className="ss-sidebar hidden lg:flex">

          {/* Top Group: Identity, Navigation & Widgets */}
          <div className="flex flex-col gap-6 overflow-y-auto min-h-0">
            <div className="flex items-center gap-3 px-1">
              <Link href="/" className="text-text-muted hover:text-text-primary transition-colors flex items-center gap-2 font-medium text-[13px]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Back
              </Link>
              <div className="w-px h-4 bg-border" />
              <span className="font-semibold text-text-primary tracking-wide text-[13px]">Training</span>
            </div>

            {/* Identity — first thing the eye lands on */}
            {userState && (
              <Link href="/profile" className="flex items-center gap-3 px-1 group">
                <div className="brand-orb w-11 h-11 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[16px] font-bold text-text-primary truncate group-hover:text-accent-light transition-colors">
                    {userState.name}
                  </div>
                  <div className="text-[11px] text-text-faint">View profile</div>
                </div>
              </Link>
            )}

            {userState && (
              <div>
                <div className="text-[10px] text-text-faint tracking-widest mb-3 font-bold uppercase">Trust Depth</div>
                <div className="ss-sidebar-card">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-text-primary tracking-tight">Level {userState.depthRung}</span>
                    <span className="text-xs font-medium text-text-faint">/ 5</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 mb-4">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div
                        key={level}
                        className={`h-1.5 rounded-full transition-colors ${
                          level <= userState.depthRung
                            ? 'bg-accent shadow-[0_0_8px_rgba(131,40,249,0.5)]'
                            : 'bg-border'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-[13px] text-text-muted leading-relaxed font-medium">
                    {userState.depthRung === 1 && "Surface-level facts, communication style, and daily rhythms."}
                    {userState.depthRung === 2 && "How you actually solve problems — reasoning, mental models, approach."}
                    {userState.depthRung === 3 && "Values, beliefs, and opinions you hold but don't always say out loud."}
                    {userState.depthRung === 4 && "Emotional triggers, frustrations, and how you're really doing."}
                    {userState.depthRung >= 5 && "Vulnerable territory — failure, fear, pride, what you'd want remembered."}
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="text-[10px] text-text-faint tracking-widest font-bold mb-3 uppercase">Clone Profile</div>
              {personality ? (
                <PersonalityStats personality={personality} completeness={completeness} />
              ) : profileLoading ? (
                <div className="text-text-faint text-sm animate-pulse font-medium">Loading profile…</div>
              ) : (
                <div className="text-text-faint text-sm font-medium">No profile data yet — answer a few questions to get started.</div>
              )}
            </div>
          </div>

          {/* Bottom Group: the rest — CTA, nav links, and Sign Out last */}
          <div className="mt-auto pt-4 flex flex-col gap-3">
            <Link href="/clone" className="btn-primary-lg justify-center">
              Talk to Clone
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <div className="bg-surface/60 border border-border rounded-[14px] p-2">
              <UserMenu name={userState?.name} showIdentity={false} />
            </div>
          </div>
        </aside>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-bg">

        {/* Ambient glow — reuses the landing page's own light-fx asset,
            toned down, so the app doesn't feel flatter than the marketing site */}
        <div className="light-fx opacity-40" aria-hidden="true">
          <div className="ray-source" />
          <div className="rays" />
        </div>

        {/* Name Gate Overlay */}
        {!nameSet && (
          <div className="absolute inset-0 flex items-center justify-center p-6 z-30 bg-bg overflow-hidden">
            <div className="light-fx opacity-50" aria-hidden="true">
              <div className="ray-source" />
              <div className="rays" />
            </div>
            <div className="name-gate-card relative z-10">
              <div className="name-gate-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
                </svg>
              </div>
              <h2 className="name-gate-title">Who are we cloning?</h2>
              <p className="name-gate-desc">Confirm your name to begin the onboarding process.</p>
              <div className="name-gate-form">
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveName()}
                  placeholder="Full name…"
                  autoFocus
                  className="name-gate-input"
                />
                <button onClick={saveName} className="btn-primary-lg justify-center flex-shrink-0">
                  Begin →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Header of Chat Area */}
        <header className="border-b border-border bg-bg/80 backdrop-blur-md shrink-0 z-20 relative">
          <div className="max-w-2xl mx-auto flex items-center px-4 sm:px-6 h-[64px]">
            <div className="lg:hidden flex items-center gap-4 min-w-0">
              <Link href="/" className="text-text-muted shrink-0">Back</Link>
              <span className="text-text-primary font-semibold shrink-0">Training</span>
              {userState && (
                <span className="text-xs text-accent-light font-semibold whitespace-nowrap shrink-0">
                  Depth {userState.depthRung}
                </span>
              )}
            </div>

            <button
              onClick={() => setVoiceEnabled(v => !v)}
              className={`ml-auto flex items-center gap-2 px-3.5 py-2 rounded-full text-xs transition-all border cursor-pointer font-medium whitespace-nowrap ${
                voiceEnabled ? 'bg-accent-soft border-accent/30 text-accent-light' : 'bg-surface/60 border-border text-text-faint hover:text-text-muted'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {voiceEnabled ? (
                  <path d="M11 5 6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>
                ) : (
                  <path d="M11 5 6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/>
                )}
              </svg>
              {voiceEnabled ? 'Voice on' : 'Voice off'}
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto relative flex flex-col items-center chat-scroll">
          <div className="w-full max-w-2xl flex-1 p-4 sm:p-8 pb-40">
            {messages.map((msg, i) => (
              <ChatBubble
                key={i}
                role={msg.role}
                content={msg.content}
                mode="onboarding"
                turnGoal={msg.turnGoal}
                depthRung={(userState?.depthRung as any) || 1}
              />
            ))}
            {loading && <ChatBubble role="assistant" content="" mode="onboarding" isTyping depthRung={(userState?.depthRung as any) || 1} />}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="absolute bottom-6 w-full flex justify-center px-4 z-20 pointer-events-none">
          <div className="w-full max-w-2xl pointer-events-auto">
            <div className={`glow-input-wrap ${inputFocused ? 'focused' : ''}`}>
              <div className="flex items-end gap-3 bg-card/95 backdrop-blur-xl rounded-[28px] p-3 pl-6 shadow-2xl">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInput}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                  placeholder="Share your thoughts…"
                  rows={1}
                  className="flex-1 bg-transparent border-none text-text-primary text-base focus:outline-none resize-none max-h-32 py-2.5 placeholder:text-text-faint leading-relaxed"
                />
                <div className="flex items-end gap-2.5 shrink-0 pb-0.5">
                  <VoiceInput onTranscription={sendMessage} mode="onboarding" disabled={loading} />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                      input.trim() && !loading
                        ? 'bg-accent text-white hover:bg-accent-hover shadow-[0_2px_10px_-2px_rgba(131,40,249,0.6)] cursor-pointer active:scale-95'
                        : 'bg-surface text-text-faint cursor-not-allowed'
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="text-center mt-3 text-xs text-text-faint font-medium">
              {truncateAtWord(currentQuestion, 60)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}