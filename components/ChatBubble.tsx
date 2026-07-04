'use client'

import { useState } from 'react'

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
  mode: string
  name?: string
  isTyping?: boolean
  turnGoal?: string
  messageId?: string
  depthRung?: 1 | 2 | 3 | 4 | 5
}

export default function ChatBubble({ role, content, mode, name, isTyping, turnGoal, messageId, depthRung = 1 }: ChatBubbleProps) {
  const isUser = role === 'user'
  const assistantName = mode === 'clone' ? (name || 'Clone') : 'Shadow Shelf'

  // The shadow elevates based on depthRung (Trust depth = screen depth)
  const shadowClass = `rung-${depthRung}-shadow`

  if (isUser) {
    return (
      <div className="ss-message flex justify-end mb-6">
        {/* User bubble is flat and slightly muted, like a prompt */}
        <div className="max-w-[75%] px-5 py-3.5 bg-[#1C1A21] border border-[#2A2630] text-text-primary text-[15px] leading-relaxed break-words rounded-sm">
          {content}
        </div>
      </div>
    )
  }

  // Assistant bubble
  return (
    <div className="ss-message flex gap-4 mb-8 max-w-[90%]">
      {/* Avatar dot */}
      <div className={`shrink-0 w-8 h-8 flex items-center justify-center text-xs mt-1 bg-surface border border-[#2A2630] ${shadowClass} transition-shadow duration-500 rounded-sm`}>
        {mode === 'clone' ? <span className="text-accent-brass">◈</span> : <span className="text-text-muted">✧</span>}
      </div>

      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-accent-cold">
            {assistantName}
          </span>
          {turnGoal && process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' && (
            <span className="text-[10px] px-2 py-0.5 bg-[#121115] border border-[#2A2630] text-accent-cold font-mono">
              [GOAL: {turnGoal}]
            </span>
          )}
          {depthRung > 1 && (
             <span className="text-[10px] px-2 py-0.5 bg-[#121115] border border-accent-brass/20 text-accent-brass font-mono">
             [RUNG {depthRung}]
           </span>
          )}
        </div>
        
        <div className="font-sans text-[15px] text-text-primary leading-[1.75] whitespace-pre-wrap break-words">
          {isTyping ? (
            <span className="flex gap-1.5 items-center py-2 h-6">
              <span className="typing-dot bg-text-muted" />
              <span className="typing-dot bg-text-muted" />
              <span className="typing-dot bg-text-muted" />
            </span>
          ) : content}
        </div>
        
        {/* Feedback UI */}
        {!isTyping && messageId && <FeedbackButtons messageId={messageId} />}
      </div>
    </div>
  )
}

function FeedbackButtons({ messageId }: { messageId: string }) {
  const [state, setState] = useState<'idle' | 'up' | 'down' | 'correcting' | 'sent'>('idle')
  const [correction, setCorrection] = useState('')

  const submitFeedback = async (rating: 'up' | 'down', correctionText?: string) => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, rating, correctionText })
      })
      setState('sent')
    } catch (err) {
      console.error('Feedback error:', err)
    }
  }

  if (state === 'sent') {
    return (
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-accent-cold">
        [Feedback logged]
      </div>
    )
  }

  if (state === 'correcting') {
    return (
      <div className="mt-4 flex flex-col gap-3">
        <textarea
          value={correction}
          onChange={e => setCorrection(e.target.value)}
          placeholder="Enter truth trace correction..."
          rows={2}
          className="w-full px-4 py-3 text-[13px] font-sans bg-bg border border-[#2A2630] text-text-primary resize-y focus:outline-none focus:border-accent-brass placeholder:text-text-muted/50 rounded-sm"
        />
        <div className="flex gap-2">
          <button
            onClick={() => submitFeedback('down', correction)}
            className="px-4 py-2 text-xs font-mono uppercase tracking-widest bg-accent-cold text-white hover:bg-accent-cold/80 transition-colors rounded-sm cursor-pointer"
          >
            Submit Correction
          </button>
          <button
            onClick={() => setState('idle')}
            className="px-4 py-2 text-xs font-mono uppercase tracking-widest bg-transparent border border-[#2A2630] text-text-muted hover:text-text-primary transition-colors rounded-sm cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`mt-3 flex gap-2 transition-opacity duration-200 ${state === 'idle' ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
      <button
        onClick={() => { setState('up'); submitFeedback('up') }}
        className="font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-text-primary cursor-pointer transition-colors"
      >
        [CONFIRM]
      </button>
      <button
        onClick={() => setState('correcting')}
        className="font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-accent-brass cursor-pointer transition-colors"
      >
        [CORRECT]
      </button>
    </div>
  )
}
