'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ChatBubble from '@/components/ChatBubble'
import VoiceInput from '@/components/VoiceInput'
import PersonalityStats from '@/components/PersonalityStats'
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
    <div className="h-screen flex bg-zinc-950 font-sans text-sm relative overflow-hidden text-zinc-100">
      
      {/* Left Sidebar (Only visible if nameSet) */}
      {nameSet && (
        <aside className="w-72 h-screen flex flex-col justify-between p-5 bg-zinc-950 border-r border-zinc-800 hidden lg:flex shrink-0">
          
          {/* Top Group: Navigation & Widgets */}
          <div className="flex flex-col space-y-6 overflow-y-auto min-h-0">
            <div className="flex items-center gap-3 mb-2 px-2 mt-2">
              <Link href="/" className="text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-2 font-medium">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Back
              </Link>
              <div className="w-px h-4 bg-zinc-800" />
              <span className="font-semibold text-zinc-200 tracking-wide">Training</span>
            </div>
            
            {userState && (
              <div>
                <div className="text-[10px] text-zinc-500 tracking-widest mb-3 font-bold uppercase">Trust Depth</div>
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-zinc-100 tracking-tight">Level {userState.depthRung}</span>
                    <span className="text-xs font-medium text-zinc-500">/ 5</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 mb-4">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div 
                        key={level} 
                        className={`h-1.5 rounded-full transition-colors ${
                          level <= userState.depthRung 
                            ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' 
                            : 'bg-zinc-800'
                        }`} 
                      />
                    ))}
                  </div>
                  <div className="text-[13px] text-zinc-400 leading-relaxed font-medium">
                    {userState.depthRung === 1 && "Surface-level facts and basic communication style."}
                    {userState.depthRung === 2 && "Values, opinions, and core beliefs."}
                    {userState.depthRung === 3 && "Emotional triggers and nuanced reactions."}
                    {userState.depthRung >= 4 && "Deep behavioral cloning and instinctual logic."}
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="text-[10px] text-zinc-500 tracking-widest font-bold mb-3 uppercase">Clone Profile</div>
              {personality ? (
                <PersonalityStats personality={personality} completeness={completeness} />
              ) : (
                <div className="text-zinc-500 text-sm animate-pulse font-medium">Loading profile...</div>
              )}
            </div>
          </div>

          {/* Bottom Group: CTA & Account */}
          <div className="pt-4 border-t border-zinc-900 shrink-0 flex flex-col gap-4 mt-6">
            <Link 
              href="/clone" 
              className="flex items-center justify-center w-full gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:brightness-110 active:scale-[0.99] shadow-[0_4px_14px_-4px_rgba(147,51,234,0.5)] border border-purple-500/50"
            >
              Talk to Clone 
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <UserMenu name={userState?.name} />
          </div>
        </aside>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-bg">
        
        {/* Name Gate Overlay */}
        {!nameSet && (
          <div className="absolute inset-0 flex items-center justify-center p-6 z-30 bg-bg">
            <div className="name-gate-card">
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
        <header className="flex items-center justify-between lg:justify-end px-6 h-[60px] border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md shrink-0 z-20">
          <div className="lg:hidden flex items-center gap-4">
            <Link href="/" className="text-zinc-400">Back</Link>
            <span className="text-zinc-200 font-semibold">Training</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setVoiceEnabled(v => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all border cursor-pointer font-medium ${
                voiceEnabled ? 'bg-purple-900/30 border-purple-500/30 text-purple-200' : 'bg-transparent border-transparent text-zinc-500 hover:bg-zinc-900'
              }`}
            >
              {voiceEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
            </button>
            {userState && (
              <span className="text-xs text-purple-400 font-semibold hidden sm:inline">
                Depth {userState.depthRung}
              </span>
            )}
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
            <div className="flex items-center gap-[10px] bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-full p-[10px] pl-5 shadow-2xl">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                placeholder="Share your thoughts…"
                rows={1}
                className="flex-1 bg-transparent border-none text-zinc-100 text-[15px] focus:outline-none resize-none max-h-32 py-2 placeholder:text-zinc-500 leading-relaxed"
              />
              <div className="flex items-center gap-2 shrink-0">
                <VoiceInput onTranscription={sendMessage} mode="onboarding" disabled={loading} />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                  className={`w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all duration-200 ${
                    input.trim() && !loading 
                      ? 'bg-purple-600 text-white hover:brightness-110 shadow-[0_2px_10px_-2px_rgba(147,51,234,0.6)] cursor-pointer active:scale-95' 
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
            <div className="text-center mt-3 text-xs text-zinc-500 font-medium">
              {currentQuestion.length > 60 ? currentQuestion.slice(0, 60) + '…' : currentQuestion}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
