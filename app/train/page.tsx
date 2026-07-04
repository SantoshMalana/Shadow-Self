'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ChatBubble from '@/components/ChatBubble'
import VoiceInput from '@/components/VoiceInput'
import PersonalityStats from '@/components/PersonalityStats'
import { getDailyQuestion } from '@/lib/questions'
import { getUserState, updateUserName } from '@/app/actions/user'

interface Message { 
  role: 'user' | 'assistant'
  content: string 
  turnGoal?: string
}

interface Personality {
  name?: string
  sessions: number
  updated_at?: string
  voiceId?: string
  communicationStyle: any
  thinkingPatterns: any
  emotionalProfile: any
  knowledgeDomains: any
}

function getCompleteness(p: Personality): number {
  let score = 0
  if (p.communicationStyle) {
    score += Math.min((p.communicationStyle.tone?.length || 0) * 5, 20)
    score += Math.min(p.communicationStyle.vocabulary?.length || 0, 15)
  }
  if (p.thinkingPatterns) {
    score += Math.min((p.thinkingPatterns.values?.length || 0) * 3, 20)
    score += Math.min(p.thinkingPatterns.opinions?.length || 0, 15)
  }
  if (p.emotionalProfile) {
    score += Math.min((p.emotionalProfile.passionTopics?.length || 0) * 3, 15)
  }
  if (p.knowledgeDomains) {
    score += Math.min(p.knowledgeDomains.length * 3, 15)
  }
  return Math.min(score, 100)
}

function timeAgo(dateString?: string) {
  if (!dateString) return ''
  const seconds = Math.round((Date.now() - new Date(dateString).getTime()) / 1000)
  const minutes = Math.round(seconds / 60)
  const hours = Math.round(minutes / 60)
  const days = Math.round(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

export default function TrainPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [personality, setPersonality] = useState<Personality | null>(null)
  const [userState, setUserState] = useState<{ id: string, name: string | null, depthRung: number, daysKnown: number } | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [nameSet, setNameSet] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
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
        if ('error' in user) {
          setUserState({ id: 'error', name: 'Database Connection Error', depthRung: 1, daysKnown: 0 } as any)
          setMessages([{ role: 'assistant', content: `⚠ System Error: ${user.error}. Please check your database connection.` }])
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
        setMessages([{ role: 'assistant', content: `⚠ Could not save your name: ${result.error}` }])
        setNameSet(true)
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
      setMessages([{ role: 'assistant', content: `⚠ Error: ${err.message || 'Unknown error'}` }])
      setNameSet(true)
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

  const completeness = personality ? getCompleteness(personality) : 0

  return (
    <div className="min-h-screen flex flex-col bg-bg font-sans text-sm relative overflow-hidden text-text-primary">
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-[60px] border-b border-border bg-[rgba(7,4,13,0.85)] backdrop-blur-[10px] sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-text-muted hover:text-text-primary transition-colors flex items-center gap-2">
            ← Back
          </Link>
          <span className="text-border">|</span>
          <span className="text-sm text-accent-light font-semibold">Training</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setVoiceEnabled(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all border cursor-pointer ${
              voiceEnabled ? 'bg-accent-soft border-border text-text-primary' : 'bg-transparent border-transparent text-text-faint hover:bg-accent-soft'
            }`}
          >
            {voiceEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
          </button>
          {userState && (
            <span className="text-xs text-accent-light font-semibold hidden sm:inline">
              Depth {userState.depthRung}
            </span>
          )}
        </div>
      </header>

      {/* Name Gate */}
      {!nameSet && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-6" style={{ background: 'radial-gradient(circle at 32% 28%, #ffffff, #c084fc 35%, #8328f9 78%)' }} />
            <h2 className="text-2xl font-bold text-text-primary mb-2">Who are we cloning?</h2>
            <p className="text-text-muted mb-8 text-sm">Confirm your name to begin the onboarding process.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                placeholder="Full name…"
                autoFocus
                className="flex-1 bg-card border border-border rounded-[var(--radius-md)] px-4 py-3 text-text-primary text-base focus:outline-none focus:border-accent transition-colors placeholder:text-text-faint"
              />
              <button onClick={saveName} className="btn-primary-lg justify-center">
                Begin →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main UI */}
      {nameSet && (
        <div className="flex-1 flex overflow-hidden relative">

          {/* Left Sidebar */}
          <aside className="ss-sidebar">
            {userState && (
              <div className="mb-2">
                <div className="text-[11px] text-accent-light tracking-wider mb-3 font-semibold uppercase">Trust Depth</div>
                <div className="ss-sidebar-card">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-text-primary">Level {userState.depthRung}</span>
                    <span className="text-xs text-text-faint">/ 5</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div key={level} className={`flex-1 h-1 rounded-full ${level <= userState.depthRung ? 'bg-accent' : 'bg-border'}`} />
                    ))}
                  </div>
                  <div className="text-xs text-text-faint mt-3 leading-relaxed">
                    {userState.depthRung === 1 && "Surface-level facts and basic communication style."}
                    {userState.depthRung === 2 && "Values, opinions, and core beliefs."}
                    {userState.depthRung === 3 && "Emotional triggers and nuanced reactions."}
                    {userState.depthRung >= 4 && "Deep behavioral cloning and instinctual logic."}
                  </div>
                </div>
              </div>
            )}

            <div className="text-[11px] text-accent-light tracking-wider font-semibold mt-2 uppercase">Clone Profile</div>
            {personality ? (
              <PersonalityStats personality={personality} completeness={completeness} />
            ) : (
              <div className="text-text-faint text-sm animate-pulse">Loading profile...</div>
            )}
            
            <div className="mt-auto pt-4">
              <Link href="/clone" className="btn-primary-lg justify-center w-full text-sm">
                Talk to Clone →
              </Link>
            </div>
          </aside>

          {/* Chat Area */}
          <div className="ss-chat-container">
            <div className="ss-chat-area chat-scroll">
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

            {/* Input */}
            <div className="ss-chat-input-wrapper">
              <div className="flex items-center gap-[10px] bg-card/90 backdrop-blur-xl border border-border rounded-full p-[10px] pl-5 shadow-2xl">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                  placeholder="Share your thoughts…"
                  rows={1}
                  className="flex-1 bg-transparent border-none text-text-primary text-[15px] focus:outline-none resize-none max-h-32 py-2 placeholder:text-text-faint leading-relaxed"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <VoiceInput onTranscription={sendMessage} mode="onboarding" disabled={loading} />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                    className={`w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all ${
                      input.trim() && !loading 
                        ? 'bg-accent text-white hover:bg-accent-hover cursor-pointer shadow-[0_4px_14px_-4px_rgba(131,40,249,0.6)]' 
                        : 'bg-border text-text-faint cursor-not-allowed'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
              <div className="text-center mt-3 text-xs text-text-faint font-medium">
                {currentQuestion.length > 60 ? currentQuestion.slice(0, 60) + '…' : currentQuestion}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
