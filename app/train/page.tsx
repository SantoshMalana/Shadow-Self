'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ChatBubble from '@/components/ChatBubble'
import VoiceInput from '@/components/VoiceInput'
import PersonalityStats from '@/components/PersonalityStats'
import { getDailyQuestion } from '@/lib/questions'

interface Message { role: 'user' | 'assistant'; content: string }
interface Personality {
  name: string; sessions: number; updated_at?: string;
  communication_style: { tone: string[]; vocabulary: string[]; sentence_patterns: string[]; explanation_style: string }
  thinking_patterns: { decision_framework: string[]; values: string[]; opinions: string[]; contrarian_positions: string[] }
  emotional_profile: { passion_topics: string[]; frustration_triggers: string[]; humor_style: string; empathy_markers: string[] }
  knowledge_domains: string[]
}

function getCompleteness(p: Personality): number {
  let score = 0
  score += Math.min(p.communication_style.tone.length * 5, 20)
  score += Math.min(p.communication_style.vocabulary.length, 15)
  score += Math.min(p.thinking_patterns.values.length * 3, 20)
  score += Math.min(p.thinking_patterns.opinions.length, 15)
  score += Math.min(p.emotional_profile.passion_topics.length * 3, 15)
  score += Math.min(p.knowledge_domains.length * 3, 15)
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
    fetch('/api/personality').then(r => r.json()).then(data => {
      setPersonality(data)
      if (data.name && data.name.length > 0) {
        setNameSet(true)
        setNameInput(data.name)
      }
      const q = getDailyQuestion(data.sessions || 0)
      setCurrentQuestion(q)
      const initialMessage = `Let's train your clone. Here's your first question:\n\n"${q}"`;
      setMessages([{ role: 'assistant', content: initialMessage }])
      // Don't auto-speak on load — wait for user interaction to avoid autoplay block
    })
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
      
      // Ensure audio is unlocked
      await audio.play()
    } catch { setSpeaking(false) }
  }

  const saveName = async () => {
    if (!nameInput.trim()) return
    await fetch('/api/personality', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameInput.trim() })
    })
    setNameSet(true)
    setPersonality(prev => prev ? { ...prev, name: nameInput.trim() } : prev)
    const q = getDailyQuestion(0)
    setCurrentQuestion(q)
    const responseMsg = `Great, ${nameInput.trim()}. Let's begin.\n\n"${q}"`;
    setMessages([{ role: 'assistant', content: responseMsg }])
    if (voiceEnabled) speakText(responseMsg)
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
        body: JSON.stringify({ messages: [...messages, userMsg], mode: 'train', question: currentQuestion })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      const updated = await fetch('/api/personality').then(r => r.json())
      setPersonality(updated)
      setCurrentQuestion(getDailyQuestion(updated.sessions || 0))
      
      if (voiceEnabled) {
        speakText(data.response, updated.voice_id)
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠ ${err.message || 'Is Ollama running?'}` }])
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
          <span style={{ color: '#888', fontWeight: '500', fontSize: '13px' }}>Training Mode</span>
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
          {personality && (
            <span style={{ fontSize: '12px', color: '#444' }}>
              {personality.sessions} sessions · {completeness}% complete
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
              Enter the name of the person being trained.
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
            <div style={{ fontSize: '11px', color: '#333', letterSpacing: '0.08em' }}>CLONE PROFILE</div>
            {personality && <PersonalityStats personality={personality} completeness={completeness} />}
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
                  mode="train"
                  isQuestion={msg.role === 'assistant' && msg.content.includes("question")}
                />
              ))}
              {loading && <ChatBubble role="assistant" content="" mode="train" isTyping />}
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
                  <VoiceInput onTranscription={sendMessage} mode="train" disabled={loading} />
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
