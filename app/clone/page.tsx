'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ChatBubble from '@/components/ChatBubble'
import VoiceInput from '@/components/VoiceInput'
import CloneAvatar from '@/components/CloneAvatar'

interface Message { role: 'user' | 'assistant'; content: string }
interface Personality {
  name: string; voice_id: string; sessions: number
  communication_style: { tone: string[] }
  thinking_patterns: { values: string[] }
  emotional_profile: { passion_topics: string[] }
  knowledge_domains: string[]
  memoriesCount?: number
}

function getCompleteness(p: Personality): number {
  let s = 0
  s += Math.min(p.communication_style.tone.length * 5, 20)
  s += Math.min(p.thinking_patterns.values.length * 3, 20)
  s += Math.min(p.emotional_profile.passion_topics.length * 3, 15)
  s += Math.min(p.knowledge_domains.length * 3, 15)
  return Math.min(s + (p.sessions > 0 ? 30 : 0), 100)
}

export default function ClonePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [personality, setPersonality] = useState<Personality | null>(null)
  const [ready, setReady] = useState(false)
  const [activating, setActivating] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const unlockedRef = useRef(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio()
    }
  }, [])

  useEffect(() => {
    let alive = true
    fetch('/api/personality').then(r => r.json()).then(data => {
      if (!alive) return
      setPersonality(data)
      if (data.name && data.sessions > 0) {
        setReady(true)
        setMessages([{ role: 'assistant', content: `${data.name} here.` }])
        setTimeout(() => alive && setFadeOut(true), 2500)
        setTimeout(() => alive && setActivating(false), 3200)
      } else {
        setActivating(false)
      }
    })
    return () => { alive = false }
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

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || activating) return
    
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
        body: JSON.stringify({ messages: [...messages, userMsg], mode: 'clone' })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const reply = data.response
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      if (voiceEnabled) {
        speakText(reply, personality?.voice_id)
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠ ${err.message}` }])
    } finally { setLoading(false) }
  }

  const completeness = personality ? getCompleteness(personality) : 0

  // Not ready
  if (personality !== null && !ready) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0a0a', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '40px',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <div style={{ fontSize: '48px', marginBottom: '24px', opacity: 0.3 }}>◈</div>
          <h2 style={{ fontSize: '22px', fontWeight: '500', color: '#d0d0d0', marginBottom: '12px' }}>
            Clone not ready yet
          </h2>
          <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.7', marginBottom: '8px' }}>
            {personality.name ? `${personality.name}'s clone needs more training before it can speak.` : 'No personality data found.'}
          </p>
          <p style={{ fontSize: '14px', color: '#444', marginBottom: '32px' }}>
            Each training session adds depth and fidelity.
          </p>
          <Link href="/train" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 24px', borderRadius: '10px',
            background: '#f0f0f0', color: '#0a0a0a',
            fontWeight: '600', fontSize: '14px', textDecoration: 'none'
          }}>
            Start Training →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', fontFamily: 'Inter, sans-serif', fontSize: '14px', position: 'relative', overflow: 'hidden' }}>

      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '56px',
        borderBottom: '1px solid #151515',
        background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ color: '#555', textDecoration: 'none', fontSize: '13px' }}>← Back</Link>
          <span style={{ color: '#222' }}>|</span>
          <span style={{ color: '#888', fontWeight: '500', fontSize: '13px' }}>Clone Mode</span>
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
          <span style={{ fontSize: '12px', color: '#444' }}>{completeness}% profile</span>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Sidebar */}
        <aside style={{
          width: '240px', flexShrink: 0,
          borderRight: '1px solid #111',
          background: '#0d0d0d',
          padding: '32px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px'
        }} className="hidden lg:flex">
          <CloneAvatar name={personality?.name || ''} isSpeaking={speaking} completeness={completeness} />

          <div style={{ width: '100%', borderTop: '1px solid #151515', paddingTop: '20px' }}>
            <p style={{ fontSize: '11px', color: '#333', letterSpacing: '0.08em', textAlign: 'center', marginBottom: '16px' }}>PROFILE</p>
            {[
              { label: 'Sessions', value: personality?.sessions || 0 },
              { label: 'Values mapped', value: personality?.thinking_patterns.values.length || 0 },
              { label: 'Domains', value: personality?.knowledge_domains.length || 0 },
              { label: 'Memories stored', value: personality?.memoriesCount || 0 },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: '#555' }}>{item.label}</span>
                <span style={{ fontSize: '12px', color: '#d0d0d0', fontWeight: '500' }}>{item.value}</span>
              </div>
            ))}
          </div>

          <Link href="/train" style={{
            display: 'block', width: '100%', textAlign: 'center', padding: '9px',
            border: '1px solid #1e1e1e', borderRadius: '8px',
            color: '#666', fontSize: '12px', textDecoration: 'none',
            transition: 'all 0.15s ease'
          }}>
            More training
          </Link>
        </aside>

        {/* Chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', alignItems: 'center', background: '#0a0a0a' }}>

          {/* Mobile avatar */}
          <div className="lg:hidden" style={{ padding: '24px 0 8px', textAlign: 'center' }}>
            <CloneAvatar name={personality?.name || ''} isSpeaking={speaking} completeness={completeness} />
          </div>

          <div
            className="chat-scroll"
            style={{ width: '100%', maxWidth: '680px', flex: 1, overflowY: 'auto', padding: '32px 24px 160px' }}
          >
            {messages.map((msg, i) => (
              <ChatBubble
                key={i}
                role={msg.role}
                content={msg.content}
                mode="clone"
                name={personality?.name}
              />
            ))}
            {loading && <ChatBubble role="assistant" content="" mode="clone" isTyping name={personality?.name} />}
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
                id="clone-message-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                placeholder={`Message ${personality?.name || 'Clone'}…`}
                rows={1}
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  color: '#f0f0f0', fontSize: '15px', fontFamily: 'Inter, sans-serif',
                  outline: 'none', resize: 'none', maxHeight: '120px',
                  lineHeight: '1.5', padding: '4px 0'
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <VoiceInput onTranscription={sendMessage} mode="clone" disabled={loading} />
                <button
                  id="clone-send-btn"
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
            <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: '#2a2a2a' }}>
              AI simulation of {personality?.name || 'this person'}. Handle with care.
            </p>
          </div>
        </div>
      </div>

      {/* Cinematic Activation Overlay */}
      {activating && ready && personality && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: '#0a0a0a',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          opacity: fadeOut ? 0 : 1,
          transition: 'opacity 0.7s ease',
          pointerEvents: fadeOut ? 'none' : 'all'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '32px', opacity: 0.5 }}>◈</div>
            <p style={{ fontSize: '12px', color: '#333', letterSpacing: '0.15em', marginBottom: '16px' }}>ACTIVATING</p>
            <h1 style={{ fontSize: '28px', fontWeight: '300', color: '#d0d0d0', letterSpacing: '0.05em' }}>
              {personality.name}
            </h1>
          </div>
        </div>
      )}
    </div>
  )
}
