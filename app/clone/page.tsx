'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ChatBubble from '@/components/ChatBubble'
import VoiceInput from '@/components/VoiceInput'
import CloneAvatar from '@/components/CloneAvatar'
import UserMenu from '@/components/UserMenu'

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
    if (typeof window !== 'undefined') audioRef.current = new Audio()
  }, [])

  useEffect(() => {
    let alive = true
    fetch('/api/personality').then(r => r.json()).then(data => {
      if (!alive) return
      if (data.error) {
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
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      if (voiceEnabled) speakText(data.response, personality?.voice_id)
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠ ${err.message}` }])
    } finally { setLoading(false) }
  }

  const completeness = personality ? getCompleteness(personality) : 0

  // Not ready or Error
  if (personality !== null && (!ready || (personality as any).error)) {
    const errorMsg = (personality as any).error
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-10 font-sans relative">
        <div className="light-fx" aria-hidden="true"><div className="ray-source" /><div className="rays" /></div>
        <div className="text-center max-w-sm relative z-10">
          <div className="w-16 h-16 rounded-full mx-auto mb-6" style={{ background: 'radial-gradient(circle at 32% 28%, #ffffff, #c084fc 35%, #8328f9 78%)', opacity: 0.4 }} />
          <h2 className={`text-2xl font-bold mb-3 ${errorMsg ? 'text-red-400' : 'text-text-primary'}`}>
            {errorMsg ? 'System Error' : 'Clone not ready yet'}
          </h2>
          <p className="text-sm text-text-muted leading-relaxed mb-8">
            {errorMsg ? `Backend Error: ${errorMsg}. Please check your database connection.` : (personality.name ? `${personality.name}'s clone needs more training.` : 'No personality data found.')}
          </p>
          <Link href="/train" className="btn-primary-lg">
            {errorMsg ? '← Back to Training' : 'Start Training →'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-zinc-950 font-sans text-sm relative overflow-hidden text-zinc-100">
      
      {/* Left Sidebar */}
      <aside className="w-72 h-screen flex flex-col justify-between p-5 bg-zinc-950 border-r border-zinc-800 hidden lg:flex shrink-0">
        
        {/* Top Group: Navigation & Widgets */}
        <div className="flex flex-col space-y-6 overflow-y-auto min-h-0">
          <div className="flex items-center gap-3 mb-2 px-2 mt-2">
            <Link href="/" className="text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-2 font-medium">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Back
            </Link>
            <div className="w-px h-4 bg-zinc-800" />
            <span className="font-semibold text-zinc-200 tracking-wide">Clone Mode</span>
          </div>
          
          <CloneAvatar name={personality?.name || ''} isSpeaking={speaking} completeness={completeness} />
          
          <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl mt-4">
            <div className="text-[10px] text-zinc-500 tracking-widest mb-4 font-bold uppercase">Profile Stats</div>
            {[
              { label: 'Sessions', value: personality?.sessions || 0 },
              { label: 'Values mapped', value: personality?.thinkingPatterns?.values?.length || 0 },
              { label: 'Domains', value: personality?.knowledgeDomains?.length || 0 },
              { label: 'Memories', value: personality?.memoriesCount || 0 },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center mb-3 last:mb-0">
                <span className="text-xs text-zinc-400 font-medium">{item.label}</span>
                <span className="text-[13px] text-zinc-200 font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Group: CTA & Account */}
        <div className="pt-4 border-t border-zinc-900 shrink-0 flex flex-col gap-4 mt-6">
          <Link 
            href="/train" 
            className="flex items-center justify-center w-full gap-2 bg-transparent hover:bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium py-3 px-4 rounded-xl transition-colors mb-4"
          >
            More training
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <UserMenu name={personality?.name} />
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-bg">
        
        {/* Top Header of Chat Area */}
        <header className="flex items-center justify-between lg:justify-end px-6 h-[60px] border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div className="lg:hidden flex items-center gap-4">
            <Link href="/" className="text-zinc-400">Back</Link>
            <span className="text-zinc-200 font-semibold">Clone Mode</span>
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
            <span className="text-xs text-purple-400 font-semibold hidden sm:inline">{completeness}% profile</span>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto relative flex flex-col items-center chat-scroll">
          <div className="lg:hidden pt-6 pb-2 text-center w-full flex justify-center">
            <CloneAvatar name={personality?.name || ''} isSpeaking={speaking} completeness={completeness} />
          </div>
          <div className="w-full max-w-2xl flex-1 p-4 sm:p-8 pb-40">
            {messages.map((msg, i) => (
              <ChatBubble key={i} role={msg.role} content={msg.content} mode="clone" name={personality?.name} />
            ))}
            {loading && <ChatBubble role="assistant" content="" mode="clone" isTyping name={personality?.name} />}
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
                placeholder={`Message ${personality?.name || 'Clone'}…`}
                rows={1}
                className="flex-1 bg-transparent border-none text-zinc-100 text-[15px] focus:outline-none resize-none max-h-32 py-2 placeholder:text-zinc-500 leading-relaxed"
              />
              <div className="flex items-center gap-2 shrink-0">
                <VoiceInput onTranscription={sendMessage} mode="clone" disabled={loading} />
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
            <p className="text-center mt-3 text-[11px] text-zinc-500 font-medium">
              AI simulation of {personality?.name || 'this person'}. Handle with care.
            </p>
          </div>
        </div>
      </div>

      {/* Cinematic Activation Overlay */}
      {activating && ready && personality && (
        <div className={`fixed inset-0 z-50 bg-bg flex flex-col items-center justify-center transition-opacity duration-700 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-8 animate-pulse" style={{ background: 'radial-gradient(circle at 32% 28%, #ffffff, #c084fc 35%, #8328f9 78%)' }} />
            <p className="text-xs text-accent-light tracking-[0.15em] mb-4 font-semibold uppercase">Activating</p>
            <h1 className="text-3xl font-bold text-text-primary tracking-wide">
              {personality.name}
            </h1>
          </div>
        </div>
      )}
    </div>
  )
}
