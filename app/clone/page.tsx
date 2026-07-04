'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ChatBubble from '@/components/ChatBubble'
import VoiceInput from '@/components/VoiceInput'
import CloneAvatar from '@/components/CloneAvatar'

interface Message { role: 'user' | 'assistant'; content: string }
interface Personality {
  name: string; voice_id: string; sessions: number
  communicationStyle: { tone: string[] }
  thinkingPatterns: { values: string[] }
  emotionalProfile: { passionTopics: string[] }
  knowledgeDomains: string[]
  memoriesCount?: number
}

function getCompleteness(p: Personality): number {
  let s = 0
  s += Math.min((p.communicationStyle?.tone?.length || 0) * 5, 20)
  s += Math.min((p.thinkingPatterns?.values?.length || 0) * 3, 20)
  s += Math.min((p.emotionalProfile?.passionTopics?.length || 0) * 3, 15)
  s += Math.min((p.knowledgeDomains?.length || 0) * 3, 15)
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio()
    }
  }, [])

  useEffect(() => {
    let alive = true
    fetch('/api/personality').then(r => r.json()).then(data => {
      if (!alive) return
      if (data.error) {
        console.error("Backend returned error:", data.error)
        setPersonality({ error: data.error } as any)
        setActivating(false)
        return
      }
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

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || activating) return
    
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
      setMessages(prev => [...prev, { role: 'assistant', content: `[ERROR: ${err.message}]` }])
    } finally { setLoading(false) }
  }

  const completeness = personality ? getCompleteness(personality) : 0

  // Not ready or Error
  if (personality !== null && (!ready || (personality as any).error)) {
    const errorMsg = (personality as any).error
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-10 font-sans selection:bg-accent-cold selection:text-white">
        <div className="text-center max-w-sm bg-surface p-10 border border-[#2A2630] rounded-sm dynamic-shadow">
          <div className="text-5xl mb-6 text-accent-cold">◈</div>
          <h2 className={`font-display text-2xl mb-3 ${errorMsg ? 'text-red-400' : 'text-text-primary'}`}>
            {errorMsg ? 'System Error' : 'Initialization Failed'}
          </h2>
          <p className="font-sans text-sm text-text-muted leading-relaxed mb-8">
            {errorMsg ? `[ERROR: ${errorMsg}]` : (personality.name ? `Cognitive trace for ${personality.name} lacks sufficient depth for standalone simulation.` : 'No trace data found.')}
          </p>
          <Link href="/train" className="inline-flex items-center gap-2 px-6 py-3 rounded-sm font-sans font-medium text-sm transition-all bg-accent-brass text-[#17161B] hover:bg-[#A99360]">
            {errorMsg ? 'Return' : 'Resume Trace'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg font-sans text-sm relative overflow-hidden text-text-primary selection:bg-accent-cold selection:text-white">

      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-[#1C1A21] bg-bg sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-mono text-[10px] text-text-muted hover:text-text-primary uppercase tracking-widest transition-colors flex items-center gap-2">
            [HOME]
          </Link>
          <span className="text-[#2A2630]">|</span>
          <span className="font-mono text-[10px] text-accent-cold uppercase tracking-widest">Clone Session</span>
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
          <span className="font-mono text-[10px] text-accent-brass uppercase tracking-widest hidden sm:inline">[{completeness}%]</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-[#1C1A21] bg-[#121115] p-6 flex-col items-center gap-8 overflow-y-auto hidden lg:flex">
          <CloneAvatar name={personality?.name || ''} isSpeaking={speaking} completeness={completeness} />

          <div className="w-full border-t border-[#1C1A21] pt-6">
            <p className="font-mono text-[10px] text-accent-cold tracking-widest text-center mb-6 uppercase">Metrics</p>
            {[
              { label: 'Trace Sessions', value: personality?.sessions || 0 },
              { label: 'Values Mapped', value: personality?.thinkingPatterns?.values?.length || 0 },
              { label: 'Domains Extracted', value: personality?.knowledgeDomains?.length || 0 },
              { label: 'Memories Logged', value: personality?.memoriesCount || 0 },
            ].map((item, i) => (
              <div key={i} className="flex justify-between mb-3 font-mono text-[10px] uppercase tracking-widest">
                <span className="text-text-muted">{item.label}</span>
                <span className="text-text-primary">{item.value}</span>
              </div>
            ))}
          </div>

          <Link href="/train" className="block w-full text-center p-3 border border-[#2A2630] bg-transparent text-text-muted hover:text-text-primary hover:bg-surface rounded-sm font-sans font-medium text-xs transition-all">
            Resume Trace Collection
          </Link>
        </aside>

        {/* Chat */}
        <div className="flex-1 flex flex-col relative items-center bg-bg">

          {/* Mobile avatar */}
          <div className="lg:hidden pt-6 pb-2 text-center w-full flex justify-center">
            <CloneAvatar name={personality?.name || ''} isSpeaking={speaking} completeness={completeness} />
          </div>

          <div className="w-full max-w-2xl flex-1 overflow-y-auto p-4 sm:p-8 pb-40 chat-scroll">
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

          {/* Flat Input Area */}
          <div className="absolute bottom-0 w-full max-w-2xl px-4 pb-8 bg-gradient-to-t from-bg via-bg to-transparent pt-10 z-20">
            <div className="flex flex-col gap-2 bg-surface border border-[#2A2630] rounded-sm p-3 shadow-2xl">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                placeholder={`Engage ${personality?.name || 'simulation'}...`}
                rows={1}
                className="flex-1 bg-transparent border-none text-text-primary text-[15px] focus:outline-none resize-none max-h-32 py-2 placeholder:text-text-muted/40 font-sans"
              />
              <div className="flex items-center justify-between border-t border-[#2A2630] pt-2 mt-1">
                <VoiceInput onTranscription={sendMessage} mode="clone" disabled={loading} />
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
            <p className="text-center mt-3 font-mono text-[10px] text-text-muted uppercase tracking-widest">
              [SIMULATION ENGINE ACTIVE]
            </p>
          </div>
        </div>
      </div>

      {/* Cinematic Activation Overlay */}
      {activating && ready && personality && (
        <div className={`fixed inset-0 z-50 bg-[#121115] flex flex-col items-center justify-center transition-opacity duration-700 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="text-center">
            <div className="font-display text-4xl mb-8 text-accent-brass animate-pulse">◈</div>
            <p className="font-mono text-[10px] text-accent-cold tracking-[0.2em] uppercase mb-4">[BOOTING TRACE]</p>
            <h1 className="font-display text-4xl text-text-primary tracking-wide">
              {personality.name}
            </h1>
          </div>
        </div>
      )}
    </div>
  )
}
