'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ChatBubble from '@/components/ChatBubble'
import VoiceInput from '@/components/VoiceInput'
import PersonalityStats from '@/components/PersonalityStats'
import { getCloneCompleteness } from '@/lib/personality-client'
import { getDailyQuestion } from '@/lib/questions'
import { getUserState, updateUserName } from '@/app/actions/user'
import UserMenu from '@/components/UserMenu'

interface Message {
  role: 'user' | 'assistant'
  content: string
  turnGoal?: string
  messageId?: string
  memoriesUsed?: number
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

interface ChatInterfaceProps {
  mode: 'onboarding' | 'clone'
}

export default function ChatInterface({ mode }: ChatInterfaceProps) {
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
  const [isInitializing, setIsInitializing] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const unlockedRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isClone = mode === 'clone'

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio()
    }
  }, [])

  useEffect(() => {
    async function loadData() {
      try {
        const user = await getUserState()
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

            // Fetch chat history
            const chatRes = await fetch(`/api/chat?mode=${mode}`).then(r => r.json())
            if (chatRes.messages && chatRes.messages.length > 0) {
              setMessages(chatRes.messages)
            } else {
              if (isClone) {
                setMessages([{ role: 'assistant', content: `Good to see you. What's on your mind?`, turnGoal: 'establish_baseline' }])
              } else {
                setMessages([{ role: 'assistant', content: `Let's continue. Here's your next question:\n\n"${q}"`, turnGoal: 'establish_baseline' }])
              }
            }
          }
        } catch (e) {
          const q = getDailyQuestion(0, user.depthRung)
          setCurrentQuestion(q)
          if (isClone) {
            setMessages([{ role: 'assistant', content: `Hey — let's talk.`, turnGoal: 'establish_baseline' }])
          } else {
            setMessages([{ role: 'assistant', content: `Let's begin. Here's your first question:\n\n"${q}"`, turnGoal: 'establish_baseline' }])
          }
        }
      } catch (err) {
        console.error("Failed to fetch user state", err)
        setLoadError('Unexpected error while loading your session.')
      } finally {
        setProfileLoading(false)
        setIsInitializing(false)
      }
    }
    loadData()
  }, [mode, isClone])

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
      const voiceParam = voiceId ? `&voiceId=${encodeURIComponent(voiceId)}` : ''
      const url = `/api/synthesize?text=${encodeURIComponent(text)}${voiceParam}`
      const audio = audioRef.current
      audio.src = url
      audio.onended = () => setSpeaking(false)
      audio.onerror = () => setSpeaking(false)
      await audio.play()
    } catch { setSpeaking(false) }
  }

  const [nameSaving, setNameSaving] = useState(false)

  const saveName = async () => {
    if (!nameInput.trim() || nameSaving) return
    setNameSaving(true)
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
      
      const responseMsg = isClone 
        ? `Great, ${result.name}. Let's talk.` 
        : `Great, ${result.name}. Let's begin.\n\n"${q}"`
      
      setMessages([{ role: 'assistant', content: responseMsg, turnGoal: 'establish_baseline' }])
      if (voiceEnabled) speakText(responseMsg)
    } catch (err) {
      console.error("Failed to save name", err)
      setLoadError("Failed to save your name.")
    } finally {
      setNameSaving(false)
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
        body: JSON.stringify({ messages: [...messages, userMsg], mode, question: currentQuestion })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, turnGoal: data.turnGoal, messageId: data.messageId, memoriesUsed: data.memoriesUsed }])
      setLoading(false)
      if (voiceEnabled) speakText(data.response, personality?.voiceId)

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
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠ ${err.message || 'API Error'}` }])
    } finally { setLoading(false) }
  }

  const deleteTrait = async (category: string, index: number) => {
    try {
      const res = await fetch('/api/personality', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, traitIndex: index })
      })
      const data = await res.json()
      if (!data.error && data.personality) {
        setPersonality(data.personality)
      }
    } catch (err) {
      console.error('Failed to delete trait:', err)
    }
  }

  const completeness = personality ? getCloneCompleteness(personality) : 0

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
          <Link href="/" className="btnPrimaryLg">← Back home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-bg font-sans text-sm relative overflow-hidden text-text-primary">

      {/* Name Gate Overlay */}
      {!nameSet && !isInitializing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className={`lightFx opacity-50`} aria-hidden="true">
            <div className="raySource" />
            <div className="rays" />
          </div>
          <div className={`nameGateCard relative z-10`}>
            <div className="nameGateIcon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
              </svg>
            </div>
            <h2 className="nameGateTitle">Who are we cloning?</h2>
            <p className="nameGateDesc">Confirm your name to begin.</p>
            <div className="nameGateForm">
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                placeholder="Full name…"
                autoFocus
                className="nameGateInput"
              />
              <button 
                onClick={saveName} 
                disabled={nameSaving || !nameInput.trim()}
                className={`btnPrimaryLg justify-center flex-shrink-0 ${nameSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {nameSaving ? 'Starting…' : 'Begin →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      {nameSet && (
        <aside className={`ssSidebar hidden lg:flex`}>
          <div className="flex flex-col gap-6 overflow-y-auto min-h-0 flex-1">
            <div className="flex items-center gap-3 px-1">
              <Link href={isClone ? "/train" : "/"} className="text-text-muted hover:text-text-primary transition-colors flex items-center gap-2 font-medium text-[13px]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Back
              </Link>
              <div className="w-px h-4 bg-border" />
              <span className="font-semibold text-text-primary tracking-wide text-[13px]">{isClone ? 'Clone' : 'Training'}</span>
            </div>

            {userState && (
              <div>
                <div className="text-[10px] text-text-faint tracking-widest mb-3 font-bold uppercase">Trust Depth</div>
                <div className="ssSidebarCard">
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
              <div className="text-[10px] text-text-faint tracking-widest font-bold uppercase mb-3">Clone Profile</div>
              {personality ? (
                <PersonalityStats personality={personality} completeness={completeness} onDeleteTrait={deleteTrait} />
              ) : profileLoading ? (
                <div className="text-text-faint text-sm animate-pulse font-medium">Loading profile…</div>
              ) : (
                <div className="text-text-faint text-sm font-medium">No profile data yet — answer a few questions to get started.</div>
              )}
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-border/40 flex flex-col gap-4">
            <Link href={isClone ? "/train" : "/clone"} className={`btnPrimaryLg justify-center w-full`}>
              {isClone ? 'Continue Training' : 'Talk to Clone'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            
            <div className="px-1">
              <UserMenu name={userState?.name} showIdentity={true} />
            </div>
          </div>
        </aside>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-bg">
        <div className={`lightFx opacity-40`} aria-hidden="true">
          <div className="raySource" />
          <div className="rays" />
        </div>

        {/* Top Header (Mobile) */}
        <header className="lg:hidden border-b border-border bg-bg/80 backdrop-blur-md shrink-0 z-20 relative">
          <div className="max-w-2xl mx-auto flex items-center justify-between px-4 sm:px-6 h-[64px]">
            <div className="flex items-center gap-4 min-w-0">
              <Link href={isClone ? "/train" : "/"} className="text-text-muted shrink-0">Back</Link>
              <span className="text-text-primary font-semibold shrink-0">{isClone ? 'Clone' : 'Training'}</span>
              {!isClone && userState && (
                <span className="text-xs text-accent-light font-semibold whitespace-nowrap shrink-0">
                  Depth {userState.depthRung}
                </span>
              )}
            </div>
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </header>

        {/* Mobile Slide-Out Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <aside className="absolute right-0 top-0 bottom-0 w-[280px] bg-card border-l border-border p-6 flex flex-col gap-6 overflow-y-auto animate-[slideInRight_0.2s_ease-out]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-text-primary">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface transition-colors" aria-label="Close menu">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {(!isClone && userState) && (
                <div className="bg-surface rounded-xl p-4 border border-border">
                  <div className="text-[10px] text-text-faint tracking-widest mb-2 font-bold uppercase">Trust Depth</div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-text-primary">Level {userState.depthRung}</span>
                    <span className="text-xs text-text-faint">/ 5</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div key={level} className={`h-1.5 rounded-full transition-colors ${level <= userState.depthRung ? 'bg-accent shadow-[0_0_8px_rgba(131,40,249,0.5)]' : 'bg-border'}`} />
                    ))}
                  </div>
                </div>
              )}

              {personality && (
                <div>
                  <div className="text-[10px] text-text-faint tracking-widest font-bold mb-3 uppercase">Clone Profile</div>
                  <PersonalityStats personality={personality} completeness={completeness} onDeleteTrait={deleteTrait} />
                </div>
              )}

              <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-border/40">
                <Link href={isClone ? "/train" : "/clone"} onClick={() => setMobileMenuOpen(false)} className={`btnPrimaryLg justify-center w-full`}>
                  {isClone ? '← Back to Training' : 'Talk to Clone'}
                  {!isClone && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
                </Link>
                <UserMenu name={userState?.name} showIdentity={true} />
              </div>
            </aside>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto relative flex flex-col items-center chat-scroll">
          <div className="w-full max-w-2xl flex-1 p-4 sm:p-8">
            {messages.map((msg, i) => (
              <ChatBubble
                key={i}
                role={msg.role}
                content={msg.content}
                mode={mode}
                name={userState?.name || undefined}
                turnGoal={msg.turnGoal}
                messageId={msg.messageId}
                memoriesUsed={msg.memoriesUsed}
                depthRung={(userState?.depthRung as any) || 1}
              />
            ))}
            {loading && <ChatBubble role="assistant" content="" mode={mode} isTyping depthRung={(userState?.depthRung as any) || 1} />}
            <div className="h-48 sm:h-56" aria-hidden="true" />
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input & Gradient Overlay */}
        <div className="absolute bottom-0 w-full z-20 pointer-events-none">
          {/* Gradient fade to hide text slipping under the input */}
          <div className="h-32 bg-gradient-to-t from-bg via-bg/80 to-transparent w-full" />
          
          <div className="absolute bottom-8 w-full flex justify-center px-4">
            <div className="w-full max-w-3xl pointer-events-auto">
              <div className="glowInputWrap">
              <div className="flex items-center gap-3 bg-surface/95 border border-border backdrop-blur-xl rounded-[32px] p-2 pl-6 shadow-2xl">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!loading) sendMessage(input) } }}
                  placeholder={isClone ? "Say something…" : "Share your thoughts…"}
                  rows={1}
                  className="flex-1 bg-transparent border-none text-text-primary text-[16px] focus:outline-none !outline-none resize-none max-h-32 leading-[40px] m-0 p-0 placeholder:text-text-faint overflow-y-auto"
                />
                <div className="flex items-center gap-1.5 shrink-0 pr-1 h-[40px]">
                  <button
                    onClick={() => setVoiceEnabled(v => !v)}
                    title={voiceEnabled ? "Voice responses on" : "Voice responses off"}
                    aria-label={voiceEnabled ? "Disable voice responses" : "Enable voice responses"}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-light ${
                      voiceEnabled ? 'text-accent-light hover:bg-accent-soft' : 'text-text-faint hover:text-text-primary hover:bg-surface'
                    }`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {voiceEnabled ? (
                        <path d="M11 5 6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>
                      ) : (
                        <path d="M11 5 6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/>
                      )}
                    </svg>
                  </button>
                  <VoiceInput onTranscription={sendMessage} mode={mode} disabled={loading} />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                    aria-label="Send message"
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-light ${
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
            {!isClone && (
              <div className="text-center mt-3 text-xs text-text-faint font-medium">
                {truncateAtWord(currentQuestion, 60)}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
