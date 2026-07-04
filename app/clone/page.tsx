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
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠ ${err.message}` }])
    } finally { setLoading(false) }
  }

  const completeness = personality ? getCompleteness(personality) : 0

  // Not ready or Error
  if (personality !== null && (!ready || (personality as any).error)) {
    const errorMsg = (personality as any).error
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-10 font-sans">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-6 opacity-30 text-neutral-500">◈</div>
          <h2 className={`text-2xl font-medium mb-3 ${errorMsg ? 'text-red-400' : 'text-neutral-200'}`}>
            {errorMsg ? 'System Error' : 'Clone not ready yet'}
          </h2>
          <p className="text-sm text-neutral-500 leading-relaxed mb-8">
            {errorMsg ? `Backend Error: ${errorMsg}. Please check your database connection in AWS Amplify.` : (personality.name ? `${personality.name}'s clone needs more training before it can speak.` : 'No personality data found.')}
          </p>
          {!errorMsg && (
            <p className="text-sm text-neutral-400 mb-8">
              Each training session adds depth and fidelity.
            </p>
          )}
          <Link href="/train" className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
            errorMsg ? 'bg-red-950/40 text-red-300 border border-red-900 hover:bg-red-900/50' : 'bg-neutral-100 text-neutral-900 hover:bg-white'
          }`}>
            {errorMsg ? '← Back to Onboarding' : 'Start Training →'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 font-sans text-sm relative overflow-hidden text-neutral-200">

      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-2 text-sm">
            ← Back
          </Link>
          <span className="text-neutral-800">|</span>
          <span className="text-neutral-400 font-medium text-sm">Clone Mode</span>
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
          <span className="text-xs text-neutral-500 hidden sm:inline">{completeness}% profile</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-neutral-900 bg-neutral-950/50 p-5 flex-col items-center gap-5 overflow-y-auto hidden lg:flex">
          <CloneAvatar name={personality?.name || ''} isSpeaking={speaking} completeness={completeness} />

          <div className="w-full border-t border-neutral-900/60 pt-5">
            <p className="text-[11px] text-neutral-600 tracking-wider text-center mb-4 font-medium">PROFILE</p>
            {[
              { label: 'Sessions', value: personality?.sessions || 0 },
              { label: 'Values mapped', value: personality?.thinkingPatterns?.values?.length || 0 },
              { label: 'Domains', value: personality?.knowledgeDomains?.length || 0 },
              { label: 'Memories stored', value: personality?.memoriesCount || 0 },
            ].map((item, i) => (
              <div key={i} className="flex justify-between mb-2.5">
                <span className="text-xs text-neutral-500">{item.label}</span>
                <span className="text-xs text-neutral-300 font-medium">{item.value}</span>
              </div>
            ))}
          </div>

          <Link href="/train" className="block w-full text-center p-2.5 border border-neutral-800 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50 text-xs transition-all">
            More training
          </Link>
        </aside>

        {/* Chat */}
        <div className="flex-1 flex flex-col relative items-center bg-neutral-950">

          {/* Mobile avatar */}
          <div className="lg:hidden pt-6 pb-2 text-center w-full flex justify-center">
            <CloneAvatar name={personality?.name || ''} isSpeaking={speaking} completeness={completeness} />
          </div>

          <div className="w-full max-w-2xl flex-1 overflow-y-auto p-4 sm:p-8 pb-40 scroll-smooth chat-scroll">
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
          <div className="absolute bottom-6 w-full max-w-2xl px-4 z-20">
            <div className="flex items-end gap-2 bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-2xl p-2 pl-4 shadow-2xl">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                placeholder={`Message ${personality?.name || 'Clone'}…`}
                rows={1}
                className="flex-1 bg-transparent border-none text-neutral-200 text-base focus:outline-none resize-none max-h-32 py-2.5 placeholder:text-neutral-600 leading-relaxed"
              />
              <div className="flex items-center gap-1.5 shrink-0 pb-1">
                <VoiceInput onTranscription={sendMessage} mode="clone" disabled={loading} />
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
            <p className="text-center mt-3 text-[11px] text-neutral-700">
              AI simulation of {personality?.name || 'this person'}. Handle with care.
            </p>
          </div>
        </div>
      </div>

      {/* Cinematic Activation Overlay */}
      {activating && ready && personality && (
        <div className={`fixed inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-center transition-opacity duration-700 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="text-center">
            <div className="text-4xl mb-8 opacity-50 text-neutral-600">◈</div>
            <p className="text-xs text-neutral-500 tracking-[0.15em] mb-4">ACTIVATING</p>
            <h1 className="text-3xl font-light text-neutral-200 tracking-wide">
              {personality.name}
            </h1>
          </div>
        </div>
      )}
    </div>
  )
}
