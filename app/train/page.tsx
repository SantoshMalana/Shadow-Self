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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio()
    }
  }, [])

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch User State
        const user = await getUserState()
        if ('error' in user) {
          console.error("Backend returned error:", user.error)
          setUserState({ id: 'error', name: 'Database Connection Error', depthRung: 1, daysKnown: 0 } as any)
          setMessages([{ role: 'assistant', content: `⚠ System Error: ${user.error}. Please check your database connection.` }])
          return
        }

        setUserState(user as any)
        if (user.name) {
          setNameSet(true)
          setNameInput(user.name)
        }

        // 2. Fetch Personality (for stats)
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
          // Ignore API errors if backend isn't ready
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
      // Update User table via server action
      const result = await updateUserName(nameInput.trim())
      
      if ('error' in result) {
        console.error("saveName error:", result.error)
        setMessages([{ role: 'assistant', content: `⚠ Could not save your name: ${result.error}. The database may not be reachable.` }])
        setNameSet(true) // Still let them through so they see the error
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
    
    // Unlock audio immediately on user interaction
    if (audioRef.current && !unlockedRef.current) {
      audioRef.current.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'
      audioRef.current.play().catch(() => {})
      unlockedRef.current = true
    }

    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
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
        turnGoal: data.turnGoal // Backend provides this now (or is mocked)
      }])
      
      // Attempt to refresh user state (trust depth might have increased)
      const refreshedUser = await getUserState()
      setUserState(refreshedUser)

      try {
        const updated = await fetch('/api/personality').then(r => r.json())
        if (!updated.error) {
          setPersonality(updated)
          setCurrentQuestion(getDailyQuestion(updated.sessions || 0, refreshedUser.depthRung))
        }
      } catch (e) {
        // Backend not ready
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>

      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '56px',
        borderBottom: '1px solid #151515',
        background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ color: '#555', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← Back
          </Link>
          <span style={{ color: '#222' }}>|</span>
          <span style={{ color: '#888', fontWeight: '500', fontSize: '13px' }}>Onboarding & Calibration</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            id="voice-toggle-btn"
            onClick={() => setVoiceEnabled(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
              background: voiceEnabled ? '#1a1a1a' : 'transparent',
              border: `1px solid ${voiceEnabled ? '#333' : '#1a1a1a'}`,
              color: voiceEnabled ? '#e0e0e0' : '#555',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              transition: 'all 0.15s ease'
            }}
          >
            {voiceEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
          </button>
          {userState && (
            <span style={{ fontSize: '12px', color: '#444' }}>
              Level {userState.depthRung} Depth
            </span>
          )}
          {personality?.updated_at && (
            <span style={{ fontSize: '12px', color: '#333' }}>Last: {timeAgo(personality.updated_at)}</span>
          )}
        </div>
      </header>

      {/* Name Gate */}
      {!nameSet && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>◈</div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#f0f0f0', marginBottom: '8px' }}>
              Who are we cloning?
            </h2>
            <p style={{ color: '#666', marginBottom: '32px', fontSize: '14px' }}>
              Confirm your name to begin the onboarding process.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                id="clone-name-input"
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                placeholder="Full name…"
                autoFocus
                style={{
                  flex: 1, background: '#0e0e0e', border: '1px solid #222',
                  borderRadius: '10px', padding: '12px 16px', color: '#f0f0f0',
                  fontSize: '15px', outline: 'none', fontFamily: 'Inter, sans-serif'
                }}
              />
              <button
                id="save-name-btn"
                onClick={saveName}
                style={{
                  padding: '12px 20px', background: '#f0f0f0', color: '#0a0a0a',
                  border: 'none', borderRadius: '10px', fontWeight: '600',
                  fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                }}
              >
                Begin →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main UI */}
      {nameSet && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left Sidebar */}
          <aside style={{
            width: '260px', flexShrink: 0,
            borderRight: '1px solid #151515',
            background: '#0d0d0d',
            padding: '20px',
            display: 'flex', flexDirection: 'column', gap: '20px',
            overflowY: 'auto'
          }} className="hidden lg:flex">
            
            {/* Trust Depth Visualization */}
            {userState && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#888', letterSpacing: '0.08em', marginBottom: '12px' }}>
                  TRUST DEPTH
                </div>
                <div style={{ background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#f0f0f0' }}>Level {userState.depthRung}</span>
                    <span style={{ fontSize: '12px', color: '#555' }}>/ 5</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map(level => (
                      <div key={level} style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        background: level <= userState.depthRung ? '#fff' : '#222'
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '12px', lineHeight: '1.5' }}>
                    {userState.depthRung === 1 && "Surface-level facts and basic communication style."}
                    {userState.depthRung === 2 && "Values, opinions, and core beliefs."}
                    {userState.depthRung === 3 && "Emotional triggers and nuanced reactions."}
                    {userState.depthRung >= 4 && "Deep behavioral cloning and instinctual logic."}
                  </div>
                </div>
              </div>
            )}

            <div style={{ fontSize: '11px', color: '#333', letterSpacing: '0.08em', marginTop: '8px' }}>CLONE PROFILE</div>
            {personality ? (
              <PersonalityStats personality={personality} completeness={completeness} />
            ) : (
              <div style={{ color: '#555', fontSize: '13px' }}>Backend starting up...</div>
            )}
            <div style={{ marginTop: 'auto' }}>
              <Link href="/clone" style={{
                display: 'block', textAlign: 'center', padding: '10px',
                background: '#f0f0f0', color: '#0a0a0a', borderRadius: '8px',
                fontWeight: '600', fontSize: '13px', textDecoration: 'none'
              }}>
                Talk to Clone →
              </Link>
            </div>
          </aside>

          {/* Chat Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', alignItems: 'center', background: '#0a0a0a' }}>
            <div
              className="chat-scroll"
              style={{ width: '100%', maxWidth: '680px', flex: 1, overflowY: 'auto', padding: '32px 24px 160px' }}
            >
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
            <div style={{
              position: 'absolute', bottom: '24px',
              width: '100%', maxWidth: '680px', padding: '0 16px', zIndex: 20
            }}>
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: '8px',
                background: '#111', border: '1px solid #222',
                borderRadius: '16px', padding: '10px 10px 10px 16px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)'
              }}>
                <textarea
                  id="train-message-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                  placeholder="Share your thoughts…"
                  rows={1}
                  style={{
                    flex: 1, background: 'transparent', border: 'none',
                    color: '#f0f0f0', fontSize: '15px', fontFamily: 'Inter, sans-serif',
                    outline: 'none', resize: 'none', maxHeight: '120px',
                    lineHeight: '1.5', padding: '4px 0'
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <VoiceInput onTranscription={sendMessage} mode="onboarding" disabled={loading} />
                  <button
                    id="train-send-btn"
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                    style={{
                      width: '34px', height: '34px', borderRadius: '8px', border: 'none',
                      background: input.trim() && !loading ? '#f0f0f0' : '#1a1a1a',
                      color: input.trim() && !loading ? '#0a0a0a' : '#444',
                      cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                      fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s ease', fontFamily: 'Inter, sans-serif'
                    }}
                  >↑</button>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: '#333' }}>
                {currentQuestion.length > 60 ? currentQuestion.slice(0, 60) + '…' : currentQuestion}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
