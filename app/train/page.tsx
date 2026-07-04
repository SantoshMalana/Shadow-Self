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
  
  // User state
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
          console.error("Backend returned error:", user.error)
          setUserState({ id: 'error', name: 'Database Connection Error', depthRung: 1, daysKnown: 0 } as any)
          setMessages([{ role: 'assistant', content: `[ERROR: ${user.error}. Check database connection.]` }])
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
            const initialMessage = `Let's continue. Here is your next question:\n\n"${q}"`
            setMessages([{ role: 'assistant', content: initialMessage, turnGoal: 'establish_baseline' }])
          }
        } catch (e) {
          const q = getDailyQuestion(0, user.depthRung)
          setCurrentQuestion(q)
          const initialMessage = `We are beginning the trace. Here is your first question:\n\n"${q}"`
          setMessages([{ role: 'assistant', content: initialMessage, turnGoal: 'establish_baseline' }])
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
        console.error("saveName error:", result.error)
        setMessages([{ role: 'assistant', content: `[ERROR: Could not save name: ${result.error}]` }])
        setNameSet(true)
        return
      }
      
      setUserState(result as any)
      setNameSet(true)
      
      const q = getDailyQuestion(0, result.depthRung)
      setCurrentQuestion(q)
      const responseMsg = `Acknowledged, ${result.name}. Let's begin.\n\n"${q}"`
      setMessages([{ role: 'assistant', content: responseMsg, turnGoal: 'establish_baseline' }])
      if (voiceEnabled) speakText(responseMsg)
    } catch (err: any) {
      console.error("saveName crashed:", err)
      setMessages([{ role: 'assistant', content: `[ERROR: ${err.message || 'Unknown error'}]` }])
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
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response, 
        turnGoal: data.turnGoal
      }])
      
      const refreshedUser = await getUserState()
      if ('error' in refreshedUser) {
        console.error("Failed to refresh user state:", refreshedUser.error)
      } else {
        setUserState(refreshedUser as any)
      }

      try {
        const updated = await fetch('/api/personality').then(r => r.json())
        if (!updated.error) {
          setPersonality(updated)
          const currentDepth = 'error' in refreshedUser ? (userState?.depthRung || 1) : refreshedUser.depthRung;
          setCurrentQuestion(getDailyQuestion(updated.sessions || 0, currentDepth))
        }
      } catch (e) {
        console.error("Failed to fetch updated personality", e)
      }
      
      if (voiceEnabled) {
        speakText(data.response, personality?.voiceId)
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `[ERROR: ${err.message || 'API Error'}]` }])
    } finally { setLoading(false) }
  }

  const completeness = personality ? getCompleteness(personality) : 0

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text-primary font-sans relative overflow-hidden selection:bg-accent-cold selection:text-white">
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-[#1C1A21] bg-bg sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-mono text-[10px] text-text-muted hover:text-text-primary uppercase tracking-widest transition-colors flex items-center gap-2">
            [HOME]
          </Link>
          <span className="text-[#2A2630]">|</span>
          <span className="font-mono text-[10px] text-accent-cold uppercase tracking-widest">Trace Interface</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setVoiceEnabled(v => !v)}
            className={`font-mono text-[10px] px-3 py-1.5 uppercase tracking-widest rounded-sm transition-colors border cursor-pointer ${
              voiceEnabled ? 'bg-surface border-[#2A2630] text-text-primary' : 'bg-transparent border-transparent text-text-muted hover:bg-surface'
            }`}
          >
            {voiceEnabled ? '[TTS: ON]' : '[TTS: OFF]'}
          </button>
          {userState && (
            <span className="font-mono text-[10px] text-accent-brass uppercase tracking-widest hidden sm:inline">
              RUNG {userState.depthRung}
            </span>
          )}
        </div>
      </header>

      {/* Name Gate */}
      {!nameSet && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-surface p-10 border border-[#2A2630] rounded-sm dynamic-shadow text-center">
            <h2 className="font-display text-2xl text-text-primary mb-2">Identify</h2>
            <p className="font-sans text-text-muted text-sm mb-8">Confirm subject identity.</p>
            
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                placeholder="Full name"
                autoFocus
                className="w-full bg-bg border border-[#2A2630] rounded-sm px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-accent-brass transition-colors placeholder:text-text-muted/50 font-sans"
              />
              <button
                onClick={saveName}
                className="w-full px-4 py-3 bg-accent-brass text-[#17161B] rounded-sm font-sans font-medium text-sm hover:bg-[#A99360] transition-colors cursor-pointer"
              >
                Establish Trace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main UI */}
      {nameSet && (
        <div className="flex-1 flex overflow-hidden relative">

          {/* Left Sidebar (Desktop) */}
          <aside className="w-64 shrink-0 border-r border-[#1C1A21] bg-[#121115] p-6 flex-col gap-8 overflow-y-auto hidden lg:flex">
            {userState && (
              <div>
                <div className="font-mono text-[10px] text-accent-cold tracking-widest uppercase mb-4">Trust Depth</div>
                <div className="bg-surface border border-[#2A2630] rounded-sm p-5 dynamic-shadow">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-display text-xl text-text-primary">Rung {userState.depthRung}</span>
                    <span className="font-mono text-[10px] text-text-muted">/ 5</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div key={level} className={`flex-1 h-0.5 ${level <= userState.depthRung ? 'bg-accent-brass' : 'bg-[#2A2630]'}`} />
                    ))}
                  </div>
                  <div className="font-sans text-xs text-text-muted mt-4 leading-relaxed">
                    {userState.depthRung === 1 && "Surface-level facts and basic communication style."}
                    {userState.depthRung === 2 && "Values, opinions, and core beliefs."}
                    {userState.depthRung === 3 && "Emotional triggers and nuanced reactions."}
                    {userState.depthRung >= 4 && "Deep behavioral cloning and instinctual logic."}
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="font-mono text-[10px] text-accent-cold tracking-widest uppercase mb-4">Provenance</div>
              {personality ? (
                <PersonalityStats personality={personality} completeness={completeness} />
              ) : (
                <div className="font-mono text-[10px] text-text-muted animate-pulse">[LOADING_TRACE]</div>
              )}
            </div>
            
            <div className="mt-auto pt-4">
              <Link href="/clone" className="block text-center p-3 bg-surface hover:bg-[#2A2630] border border-[#2A2630] text-text-primary rounded-sm font-sans font-medium text-sm transition-colors">
                Initialize Clone
              </Link>
            </div>
          </aside>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col relative items-center w-full bg-bg">
            <div className="w-full max-w-2xl flex-1 overflow-y-auto p-4 sm:p-8 pb-40 chat-scroll">
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

            {/* Flat Input Area */}
            <div className="absolute bottom-0 w-full max-w-2xl px-4 pb-8 bg-gradient-to-t from-bg via-bg to-transparent pt-10 z-20">
              <div className="flex flex-col gap-2 bg-surface border border-[#2A2630] rounded-sm p-3 shadow-2xl">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                  placeholder="Input trace..."
                  rows={1}
                  className="flex-1 bg-transparent border-none text-text-primary text-[15px] focus:outline-none resize-none max-h-32 py-2 placeholder:text-text-muted/40 font-sans"
                />
                <div className="flex items-center justify-between border-t border-[#2A2630] pt-2 mt-1">
                  <VoiceInput onTranscription={sendMessage} mode="onboarding" disabled={loading} />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                    className={`px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest rounded-sm transition-colors cursor-pointer ${
                      input.trim() && !loading 
                        ? 'bg-accent-brass text-[#17161B] hover:bg-[#A99360]' 
                        : 'bg-transparent text-text-muted border border-[#2A2630] cursor-not-allowed'
                    }`}
                  >
                    [SEND]
                  </button>
                </div>
              </div>
              <div className="text-center mt-3 font-mono text-[10px] text-text-muted uppercase tracking-widest">
                [CONTEXT: {currentQuestion.length > 50 ? currentQuestion.slice(0, 50) + '…' : currentQuestion}]
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
