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
          setMessages([{ role: 'assistant', content: `⚠ System Error: ${user.error}. Please check your database connection in AWS Amplify.` }])
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
            const initialMessage = `Let's continue onboarding. Here's your first question:\n\n"${q}"`
            setMessages([{ role: 'assistant', content: initialMessage, turnGoal: 'establish_baseline' }])
          }
        } catch (e) {
          const q = getDailyQuestion(0, user.depthRung)
          setCurrentQuestion(q)
          const initialMessage = `Let's begin onboarding. Here's your first question:\n\n"${q}"`
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
        setMessages([{ role: 'assistant', content: `⚠ Could not save your name: ${result.error}. The database may not be reachable.` }])
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
      console.error("saveName crashed:", err)
      setMessages([{ role: 'assistant', content: `⚠ Error: ${err.message || 'Unknown error'}. Check console for details.` }])
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
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠ ${err.message || 'API Error'}` }])
    } finally { setLoading(false) }
  }

  const completeness = personality ? getCompleteness(personality) : 0

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 font-sans text-sm relative overflow-hidden text-neutral-200">
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-2 text-sm">
            ← Back
          </Link>
          <span className="text-neutral-800">|</span>
          <span className="text-neutral-400 font-medium text-sm">Onboarding & Calibration</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setVoiceEnabled(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 border ${
              voiceEnabled ? 'bg-neutral-900 border-neutral-800 text-neutral-200' : 'bg-transparent border-transparent text-neutral-600 hover:bg-neutral-900'
            }`}
          >
            {voiceEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
          </button>
          {userState && (
            <span className="text-xs text-neutral-500 hidden sm:inline">
              Level {userState.depthRung} Depth
            </span>
          )}
          {personality?.updated_at && (
            <span className="text-xs text-neutral-600 hidden md:inline">Last: {timeAgo(personality.updated_at)}</span>
          )}
        </div>
      </header>

      {/* Name Gate */}
      {!nameSet && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md text-center">
            <div className="text-4xl mb-4 text-neutral-700 animate-pulse">◈</div>
            <h2 className="text-2xl font-semibold text-neutral-100 mb-2">Who are we cloning?</h2>
            <p className="text-neutral-500 mb-8 text-sm">Confirm your name to begin the onboarding process.</p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                placeholder="Full name…"
                autoFocus
                className="flex-1 bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-100 text-base focus:outline-none focus:ring-2 focus:ring-neutral-700 transition-all placeholder:text-neutral-600"
              />
              <button
                onClick={saveName}
                className="px-6 py-3 bg-neutral-100 text-neutral-950 rounded-xl font-medium text-sm hover:bg-white transition-colors"
              >
                Begin →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main UI */}
      {nameSet && (
        <div className="flex-1 flex overflow-hidden relative">

          {/* Left Sidebar (Desktop) */}
          <aside className="w-64 shrink-0 border-r border-neutral-900 bg-neutral-950/50 p-5 flex-col gap-5 overflow-y-auto hidden lg:flex">
            {userState && (
              <div className="mb-2">
                <div className="text-xs text-neutral-600 tracking-wider mb-3 font-medium">TRUST DEPTH</div>
                <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-semibold text-neutral-200">Level {userState.depthRung}</span>
                    <span className="text-xs text-neutral-500">/ 5</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div key={level} className={`flex-1 h-1 rounded-full ${level <= userState.depthRung ? 'bg-neutral-200' : 'bg-neutral-800'}`} />
                    ))}
                  </div>
                  <div className="text-xs text-neutral-500 mt-3 leading-relaxed">
                    {userState.depthRung === 1 && "Surface-level facts and basic communication style."}
                    {userState.depthRung === 2 && "Values, opinions, and core beliefs."}
                    {userState.depthRung === 3 && "Emotional triggers and nuanced reactions."}
                    {userState.depthRung >= 4 && "Deep behavioral cloning and instinctual logic."}
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-neutral-600 tracking-wider font-medium mt-2">CLONE PROFILE</div>
            {personality ? (
              <PersonalityStats personality={personality} completeness={completeness} />
            ) : (
              <div className="text-neutral-600 text-sm animate-pulse">Backend starting up...</div>
            )}
            
            <div className="mt-auto pt-4">
              <Link href="/clone" className="block text-center p-2.5 bg-neutral-100 hover:bg-white text-neutral-950 rounded-lg font-medium text-sm transition-colors">
                Talk to Clone →
              </Link>
            </div>
          </aside>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col relative items-center w-full">
            <div className="w-full max-w-2xl flex-1 overflow-y-auto p-4 sm:p-8 pb-40 scroll-smooth">
              {messages.map((msg, i) => (
                <ChatBubble
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  mode="onboarding"
                  turnGoal={msg.turnGoal}
                />
              ))}
              {loading && <ChatBubble role="assistant" content="" mode="onboarding" isTyping />}
              <div ref={chatEndRef} />
            </div>

            {/* Floating Input */}
            <div className="absolute bottom-6 w-full max-w-2xl px-4 z-20">
              <div className="flex items-end gap-2 bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-2xl p-2 pl-4 shadow-2xl">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                  placeholder="Share your thoughts…"
                  rows={1}
                  className="flex-1 bg-transparent border-none text-neutral-200 text-base focus:outline-none resize-none max-h-32 py-2.5 placeholder:text-neutral-600 leading-relaxed"
                />
                <div className="flex items-center gap-1.5 shrink-0 pb-1">
                  <VoiceInput onTranscription={sendMessage} mode="onboarding" disabled={loading} />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      input.trim() && !loading 
                        ? 'bg-neutral-200 text-neutral-950 hover:bg-white cursor-pointer' 
                        : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                    }`}
                  >
                    <span className="font-medium text-lg">↑</span>
                  </button>
                </div>
              </div>
              <div className="text-center mt-3 text-xs text-neutral-600 font-medium">
                {currentQuestion.length > 60 ? currentQuestion.slice(0, 60) + '…' : currentQuestion}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
