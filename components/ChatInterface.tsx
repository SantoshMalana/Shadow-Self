'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ChatBubble from '@/components/ChatBubble'
import VoiceInput from '@/components/VoiceInput'
import PersonalityStats from '@/components/PersonalityStats'
import Sidebar from '@/components/Sidebar'
import { getCloneCompleteness } from '@/lib/personality-client'
import { getDailyQuestion } from '@/lib/questions'
import { getUserState, updateUserName } from '@/app/actions/user'
import { createParser } from 'eventsource-parser'

const THINKING_LABELS = [
  'Recalling memories…',
  'Analyzing patterns…',
  'Synthesizing thoughts…',
  'Formulating response…',
  'Thinking deeply…',
]

function getTimeBasedGreeting(name?: string): string {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  return name ? `${greeting}, ${name}` : greeting
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  turnGoal?: string
  messageId?: string
  memoriesUsed?: number
}

interface Personality {
  name?: string
  sessions: number
  updatedAt?: string
  voiceId?: string
  communicationStyle: any
  thinkingPatterns: any
  emotionalProfile: any
  knowledgeDomains: any
}

function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…'
}

interface ChatInterfaceProps {
  mode: 'train' | 'onboarding' | 'clone' | 'jarvis'
  chatId?: string
}

// Mode-specific config
const modeConfig = {
  train: {
    label: 'The Interviewer',
    welcomeTitle: (name: string) => `Hey ${name}, let's train your twin.`,
    welcomeSub: `Answer a few questions. I'll extract your reasoning, values, and voice — building a cognitive clone that thinks just like you.`,
    placeholder: 'Share your thoughts…',
    accentColor: 'bg-[var(--color-accent-purple)]',
    pill: 'Training',
  },
  onboarding: {
    label: 'The Interviewer',
    welcomeTitle: (name: string) => `Hey ${name}, let's train your twin.`,
    welcomeSub: `Answer a few questions. I'll extract your reasoning, values, and voice — building a cognitive clone that thinks just like you.`,
    placeholder: 'Share your thoughts…',
    accentColor: 'bg-[var(--color-accent-purple)]',
    pill: 'Training',
  },
  clone: {
    label: 'The Replica',
    welcomeTitle: (name: string) => `Hey ${name}, what's on your mind?`,
    welcomeSub: 'Your digital twin is ready. Ask it anything — it responds with your logic, your voice, and your actual opinions.',
    placeholder: 'Talk to your clone…',
    accentColor: 'bg-[var(--color-status)]',
    pill: 'Replica',
  },
  jarvis: {
    label: 'Jarvis Mode',
    welcomeTitle: (name: string) => `Hey ${name}, what are we cooking today?`,
    welcomeSub: `Your AI pair-programmer. Throw a problem, a half-baked idea, or a hard question — let's think through it together.`,
    placeholder: 'Type your prompt here…',
    accentColor: 'bg-blue-600',
    pill: 'Jarvis',
  },
}

export default function ChatInterface({ mode, chatId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [personality, setPersonality] = useState<Personality | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [userState, setUserState] = useState<{ id: string, name: string | null, depthRung: number, daysKnown: number } | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [nameSet, setNameSet] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [nameSaving, setNameSaving] = useState(false)
  const [thinkingLabel, setThinkingLabel] = useState('')
  const [extractionToast, setExtractionToast] = useState<string | null>(null)
  const thinkingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const router = useRouter()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const unlockedRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Track the active chatId in a ref so it survives router.replace without re-render
  const activeChatIdRef = useRef<string | undefined>(chatId)

  const isClone = mode === 'clone'
  const isJarvis = mode === 'jarvis'
  const cfg = modeConfig[mode]
  const hasMessages = messages.length > 0

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio()
    }
  }, [])

  useEffect(() => {
    // Sync the ref and reset message history when navigating to a different chat
    activeChatIdRef.current = chatId
    setMessages([])
    async function loadData() {
      setIsInitializing(true)
      try {
        const user = await getUserState()
        if ('error' in user) {
          setLoadError(user.error)
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
            const url = chatId ? `/api/chat?mode=${mode}&chatId=${chatId}` : `/api/chat?mode=${mode}`
            const chatRes = await fetch(url).then(r => r.json())
            if (chatRes.messages && chatRes.messages.length > 0) {
              setMessages(chatRes.messages)
            }
          }
        } catch (e) {
          const q = getDailyQuestion(0, user.depthRung)
          setCurrentQuestion(q)
        }
      } catch (err) {
        console.error('Failed to fetch user state', err)
        setLoadError('Unexpected error while loading your session.')
      } finally {
        setProfileLoading(false)
        setIsInitializing(false)
      }
    }
    loadData()
  }, [mode, chatId])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  const speakText = async (text: string, voiceId?: string) => {
    if (!audioRef.current) return
    try {
      setSpeaking(true)
      const voiceParam = voiceId ? `&voiceId=${encodeURIComponent(voiceId)}` : ''
      const url = `/api/synthesize?text=${encodeURIComponent(text)}${voiceParam}`
      const audio = audioRef.current
      audio.src = url
      audio.onended = () => setSpeaking(false)
      audio.onerror = () => setSpeaking(false)
      await audio.play()
    } catch { setSpeaking(false) }
  }

  const saveName = async () => {
    if (!nameInput.trim() || nameSaving) return
    setNameSaving(true)
    try {
      const result = await updateUserName(nameInput.trim())
      if ('error' in result) {
        setLoadError(result.error)
        return
      }
      setUserState(result as any)
      setNameSet(true)
      const q = getDailyQuestion(0, result.depthRung)
      setCurrentQuestion(q)
    } catch (err) {
      console.error('Failed to save name', err)
      setLoadError('Failed to save your name.')
    } finally {
      setNameSaving(false)
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
    
    // Start cycling through thinking labels
    let labelIndex = 0
    setThinkingLabel(THINKING_LABELS[0])
    thinkingIntervalRef.current = setInterval(() => {
      labelIndex = (labelIndex + 1) % THINKING_LABELS.length
      setThinkingLabel(THINKING_LABELS[labelIndex])
    }, 1800)
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], mode, question: currentQuestion, chatId: activeChatIdRef.current })
      })
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `API Error: ${res.status}`)
      }
      
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response stream')
      
      const tempId = Date.now().toString()
      let assistantMsg: Message = { role: 'assistant', content: '', messageId: tempId }
      setMessages(prev => [...prev, assistantMsg])
      
      let fullContent = ''
      let isFirstChunk = true
      
      const parser = createParser({
        onEvent: (event: any) => {
          if (event.type === 'event') {
            try {
              const data = JSON.parse(event.data)
              if (data.type === 'metadata') {
                if (data.chatId && !activeChatIdRef.current) {
                  activeChatIdRef.current = data.chatId
                  const pathSegment = mode === 'onboarding' ? 'train' : mode
                  router.replace(`/${pathSegment}/${data.chatId}`)
                }
                assistantMsg = { ...assistantMsg, turnGoal: data.turnGoal, memoriesUsed: data.memoriesUsed }
                setMessages(prev => prev.map(m => m.messageId === tempId ? assistantMsg : m))
              } else if (data.type === 'content') {
                if (isFirstChunk) {
                  isFirstChunk = false
                  if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current)
                  setThinkingLabel('')
                }
                fullContent += data.text
                assistantMsg = { ...assistantMsg, content: fullContent }
                setMessages(prev => prev.map(m => m.messageId === tempId ? assistantMsg : m))
              }
            } catch (e) {
              console.error('SSE parse error', e)
            }
          }
        }
      })
      
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        parser.feed(decoder.decode(value, { stream: true }))
      }

      setLoading(false)
      if (voiceEnabled) speakText(fullContent, personality?.voiceId)
      
      // Non-blocking background refresh of user state + personality
      ;(async () => {
        try {
          const [newUserState, newPersonality] = await Promise.all([
            getUserState(), 
            fetch('/api/personality').then(r => r.json()).catch(() => null)
          ])
          if (newUserState) setUserState(newUserState as any)
          if (newPersonality) {
            // Check for new traits
            const oldScore = personality ? getCloneCompleteness(personality) : 0
            const newScore = getCloneCompleteness(newPersonality)
            if (newScore > oldScore && oldScore > 0) {
              setExtractionToast('Learned a new trait')
              setTimeout(() => setExtractionToast(null), 3000)
            }
            setPersonality(newPersonality)
          }
        } catch (e) { /* ignore */ }
      })()
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠ ${err.message || 'API Error'}` }])
    } finally {
      setLoading(false)
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current)
      setThinkingLabel('')
    }
  }

  const deleteTrait = async (category: string, index: number) => {
    try {
      const res = await fetch('/api/personality', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, traitIndex: index })
      })
      const data = await res.json()
      if (!data.error && data.personality) setPersonality(data.personality)
    } catch (err) { console.error('Failed to delete trait:', err) }
  }

  const completeness = personality ? getCloneCompleteness(personality) : 0

  if (loadError) {
    return (
      <div className="h-screen bg-bg flex flex-col items-center justify-center p-10 font-sans">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full mx-auto mb-6 bg-accent-soft flex items-center justify-center text-accent-light">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-text-primary">System Error</h2>
          <p className="text-sm text-text-muted leading-relaxed mb-8">{loadError}. Please check your database connection.</p>
          <Link href="/" className="btnPrimaryLg">← Back home</Link>
        </div>
      </div>
    )
  }

  const userName = userState?.name?.split(' ')[0] || 'there'

  return (
    <div className="h-screen flex bg-bg font-sans text-sm overflow-hidden text-text-primary">

      {/* ── Shared Global Sidebar ── */}
      <Sidebar />

      {/* ── Name Gate Overlay ── */}
      {!nameSet && !isInitializing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm">
          <div className="nameGateCard relative z-10">
            <div className="nameGateIcon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
              </svg>
            </div>
            <h2 className="nameGateTitle">Who are we cloning?</h2>
            <p className="nameGateDesc">Confirm your name to begin.</p>
            <div className="nameGateForm">
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                placeholder="Full name…"
                autoFocus
                className="nameGateInput"
              />
              <button
                onClick={saveName}
                disabled={nameSaving || !nameInput.trim()}
                className={`btnPrimaryLg justify-center flex-shrink-0 ${nameSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {nameSaving ? 'Starting…' : 'Begin →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content area (split: left context panel + right chat) ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Context Panel (left, only for Interviewer & Replica) */}
        {nameSet && !isJarvis && (
          <aside className="hidden xl:flex w-[260px] shrink-0 border-r border-border flex-col bg-bg">
            <div className="p-5 border-b border-border flex items-center gap-2 h-[60px]">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${cfg.accentColor}`}>
                {cfg.pill}
              </span>
              <span className="text-xs text-text-faint">Context</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
              {userState && (
                <div>
                  <div className="text-[10px] text-text-faint tracking-widest mb-2.5 font-bold uppercase">Trust Depth</div>
                  <div className="bg-surface border border-border rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-base font-bold text-text-primary">Level {userState.depthRung}</span>
                      <span className="text-xs font-medium text-text-faint">/ 5</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 mb-3">
                      {[1, 2, 3, 4, 5].map(level => (
                        <div
                          key={level}
                          className={`h-1.5 rounded-full transition-colors ${level <= userState.depthRung ? 'bg-[var(--color-accent-purple)] shadow-[0_0_8px_rgba(131,40,249,0.4)]' : 'bg-border'}`}
                        />
                      ))}
                    </div>
                    <div className="text-[12px] text-text-muted leading-relaxed">
                      {userState.depthRung === 1 && 'Surface-level facts & communication style.'}
                      {userState.depthRung === 2 && 'How you solve problems — reasoning & models.'}
                      {userState.depthRung === 3 && 'Values, beliefs, and opinions you hold.'}
                      {userState.depthRung === 4 && 'Emotional triggers and how you\'re really doing.'}
                      {userState.depthRung >= 5 && 'Vulnerable territory — failure, fear, pride.'}
                    </div>
                  </div>
                </div>
              )}
              <div>
                <div className="text-[10px] text-text-faint tracking-widest font-bold uppercase mb-2.5">Clone Profile</div>
                {personality ? (
                  <PersonalityStats personality={personality} completeness={completeness} onDeleteTrait={deleteTrait} />
                ) : profileLoading ? (
                  <div className="text-text-faint text-xs animate-pulse">Loading profile…</div>
                ) : (
                  <div className="text-text-faint text-xs">Answer a few questions to build your profile.</div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-border">
              <Link href={isClone ? '/train' : '/clone'} className="btnPrimaryLg justify-center w-full text-sm">
                {isClone ? 'Go to Training' : 'Talk to Clone'}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
          </aside>
        )}

        {/* ── Right: Chat Column ── */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-bg">

          {/* Subtle gradient bg */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[var(--color-accent-purple)]/10 rounded-full blur-[120px] opacity-50" />
          </div>

          {/* Extraction Toast */}
          {extractionToast && (
            <div className="absolute top-20 right-6 z-50 animate-fade-in-up">
              <div className="bg-surface/80 border border-[var(--color-status)]/30 text-[var(--color-status)] px-4 py-2 rounded-full text-[13px] font-medium shadow-lg flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                {extractionToast}
              </div>
            </div>
          )}

          {/* ── Top Header ── */}
          <header className="shrink-0 border-b border-border bg-white/80 backdrop-blur-md z-20 relative">
            <div className="max-w-3xl mx-auto px-6 h-[60px] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${cfg.accentColor}`} />
                <span className="font-semibold text-text-primary text-sm">{cfg.label}</span>
                {userState && mode !== 'jarvis' && (
                  <>
                    <div className="w-px h-4 bg-border" />
                    <div className="flex items-center gap-1.5">
                      {[1,2,3,4,5].map(l => (
                        <div key={l} className={`w-3.5 h-1 rounded-full ${l <= userState.depthRung ? 'bg-[var(--color-accent-purple)]' : 'bg-border'}`} />
                      ))}
                      <span className="text-[11px] text-text-faint ml-1">Depth {userState.depthRung}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Voice toggle */}
                <button
                  onClick={() => setVoiceEnabled(v => !v)}
                  title={voiceEnabled ? 'Voice on' : 'Voice off'}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${voiceEnabled ? 'text-[var(--color-accent-purple)] bg-[var(--color-accent-soft)]' : 'text-text-faint hover:text-text-primary hover:bg-surface'}`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {voiceEnabled ? <path d="M11 5 6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/> : <path d="M11 5 6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/>}
                  </svg>
                </button>

                {/* Mobile menu */}
                <button
                  onClick={() => setMobileMenuOpen(v => !v)}
                  className="xl:hidden w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* ── Mobile Slide-Out ── */}
          {mobileMenuOpen && (
            <div className="xl:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
              <aside className="absolute right-0 top-0 bottom-0 w-[280px] bg-white border-l border-border p-6 flex flex-col gap-5 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary">Menu</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                {userState && mode !== 'jarvis' && (
                  <div className="bg-surface rounded-xl p-4 border border-border">
                    <div className="text-[10px] text-text-faint tracking-widest mb-2 font-bold uppercase">Trust Depth</div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-text-primary">Level {userState.depthRung}</span>
                      <span className="text-xs text-text-faint">/ 5</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1,2,3,4,5].map(l => (
                        <div key={l} className={`h-1.5 rounded-full ${l <= userState.depthRung ? 'bg-[var(--color-accent-purple)]' : 'bg-border'}`} />
                      ))}
                    </div>
                  </div>
                )}
                {personality && (
                  <div>
                    <div className="text-[10px] text-text-faint tracking-widest font-bold mb-2 uppercase">Clone Profile</div>
                    <PersonalityStats personality={personality} completeness={completeness} onDeleteTrait={deleteTrait} />
                  </div>
                )}
                <div className="mt-auto">
                  <Link href={isClone ? '/train' : '/clone'} onClick={() => setMobileMenuOpen(false)} className="btnPrimaryLg justify-center w-full">
                    {isClone ? 'Go to Training' : 'Talk to Clone'}
                  </Link>
                </div>
              </aside>
            </div>
          )}

          {/* ── Chat Area ── */}
          <div className="flex-1 overflow-y-auto flex flex-col relative z-10">

            {/* Welcome Screen — shown when no messages yet */}
            {!hasMessages && !isInitializing && nameSet && (
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 animate-fade-in-up">
                <div className={`w-14 h-14 rounded-2xl ${cfg.accentColor} flex items-center justify-center mb-6 shadow-lg`}>
                  {mode === 'onboarding' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  )}
                  {mode === 'clone' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/></svg>
                  )}
                  {mode === 'jarvis' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-text-primary tracking-tight text-center mb-3">
                  {mode === 'train' || mode === 'onboarding' 
                    ? getTimeBasedGreeting(userName)
                    : cfg.welcomeTitle(userName)}
                </h1>
                <p className="text-text-muted text-base text-center max-w-md leading-relaxed mb-8">
                  {cfg.welcomeSub}
                </p>

                {/* Quick starter prompts */}
                {mode === 'onboarding' && currentQuestion && (
                  <button
                    onClick={() => {
                      setInput(currentQuestion)
                      if (textareaRef.current) textareaRef.current.focus()
                    }}
                    className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-muted hover:text-text-primary hover:border-[var(--color-accent-purple)]/30 transition-all max-w-sm text-center"
                  >
                    <span className="text-[var(--color-accent-purple)] font-medium mr-2">Today's question:</span>
                    {truncateAtWord(currentQuestion, 70)}
                  </button>
                )}
                {mode === 'train' && (
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {["Tell me a bit about how you think.", "I want to share something that's been on my mind.", "Let's explore a new topic."].map(s => (
                      <button key={s} onClick={() => { setInput(s); textareaRef.current?.focus() }}
                        className="px-3.5 py-2 bg-surface border border-border rounded-xl text-xs text-text-muted hover:text-text-primary hover:border-[var(--color-status)] transition-all">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {mode === 'clone' && (
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {[`What would ${userName || 'I'} say about...`, "How do you approach hard problems?", "What do you think about AI?"].map(s => (
                      <button key={s} onClick={() => { setInput(s); textareaRef.current?.focus() }}
                        className="px-3.5 py-2 bg-surface border border-border rounded-xl text-xs text-text-muted hover:text-text-primary hover:border-[var(--color-status)] transition-all">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {mode === 'jarvis' && (
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {["Debug this with me", "Help me architect this system", "What's wrong with my approach?"].map(s => (
                      <button key={s} onClick={() => { setInput(s); textareaRef.current?.focus() }}
                        className="px-3.5 py-2 bg-surface border border-border rounded-xl text-xs text-text-muted hover:text-text-primary hover:border-blue-300 transition-all">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Loading spinner before init */}
            {isInitializing && (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[var(--color-accent-purple)]/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {hasMessages && (
              <div className="w-full max-w-2xl mx-auto px-4 sm:px-8 py-6 flex flex-col">
                {messages.map((msg, i) => (
                  <ChatBubble
                    key={i}
                    role={msg.role}
                    content={msg.content}
                    mode={mode}
                    name={userState?.name || undefined}
                    turnGoal={msg.turnGoal}
                    messageId={msg.messageId}
                    memoriesUsed={msg.memoriesUsed}
                    depthRung={(userState?.depthRung as any) || 1}
                  />
                ))}
                {loading && <ChatBubble role="assistant" content="" mode={mode} isTyping thinkingLabel={thinkingLabel} depthRung={(userState?.depthRung as any) || 1} />}
                <div className="h-48" aria-hidden="true" />
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* ── Floating Input ── */}
          <div className="absolute bottom-0 w-full z-20 pointer-events-none">
            <div className="h-28 bg-gradient-to-t from-bg via-bg/70 to-transparent w-full" />
            <div className="absolute bottom-6 w-full flex justify-center px-4">
              <div className="w-full max-w-3xl pointer-events-auto">
                <div className={`flex items-center gap-2 bg-white/95 border border-border backdrop-blur-xl rounded-[32px] p-2 pl-5 shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-all duration-300 ${isFocused ? 'shadow-[0_8px_40px_rgba(131,40,249,0.12)] border-[var(--color-accent-purple)]/30' : ''}`}>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInput}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!loading) sendMessage(input) } }}
                    placeholder={cfg.placeholder}
                    rows={1}
                    className="flex-1 bg-transparent border-none text-text-primary text-[15px] focus:outline-none resize-none max-h-[200px] leading-[24px] py-[8px] placeholder:text-text-faint overflow-y-auto"
                    style={{ minHeight: '40px' }}
                  />
                  <div className="flex items-center gap-1 shrink-0 pr-1">
                    <VoiceInput onTranscription={sendMessage} mode={mode} disabled={loading} />
                    <button
                      onClick={() => sendMessage(input)}
                      disabled={loading || !input.trim()}
                      aria-label="Send"
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                        input.trim() && !loading
                          ? `${cfg.accentColor} text-white shadow-lg cursor-pointer active:scale-95`
                          : 'bg-surface text-text-faint cursor-not-allowed'
                      }`}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
                {mode === 'onboarding' && currentQuestion && hasMessages && (
                  <div className="text-center mt-2 text-xs text-text-faint">
                    {truncateAtWord(currentQuestion, 70)}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
