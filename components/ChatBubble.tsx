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

  if (isUser) {
    return (
      <div className="ss-message flex justify-end mb-6">
        <div className="max-w-[78%] px-3.5 py-2.5 rounded-2xl rounded-br-sm bg-accent-soft text-text-primary text-sm leading-[1.5] break-words">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="ss-message flex gap-3.5 mb-8 max-w-[90%]">
      {/* Avatar */}
      <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-1" style={{ background: 'radial-gradient(circle at 32% 28%, #ffffff, #c084fc 35%, #8328f9 78%)' }}>
        <span className="text-[10px] text-white font-bold">◈</span>
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold text-text-muted">
            {assistantName}
          </span>
          {turnGoal && process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' && (
            <span className="text-[10px] px-2 py-0.5 bg-accent-soft border border-border text-accent-light rounded-full font-mono">
              {turnGoal}
            </span>
          )}
          {depthRung > 1 && (
             <span className="text-[10px] px-2 py-0.5 bg-accent-soft border border-accent/30 text-accent-light rounded-full font-mono">
             Rung {depthRung}
           </span>
          )}
        </div>
        
        <div className="text-[15px] text-text-primary leading-[1.7] whitespace-pre-wrap break-words">
          {isTyping ? (
            <span className="flex gap-1.5 items-center py-2 h-6">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </span>
          ) : content}
        </div>
        
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
      <div className="mt-2 text-[11px] text-accent-light font-medium">
        ✓ Feedback logged
      </div>
    )
  }

  if (state === 'correcting') {
    return (
      <div className="mt-4 flex flex-col gap-3">
        <textarea
          value={correction}
          onChange={e => setCorrection(e.target.value)}
          placeholder="How should the clone have responded?"
          rows={2}
          className="w-full px-4 py-3 text-[13px] bg-bg border border-border text-text-primary resize-y focus:outline-none focus:border-accent placeholder:text-text-faint rounded-[var(--radius-md)]"
        />
        <div className="flex gap-2">
          <button
            onClick={() => submitFeedback('down', correction)}
            className="btn-pill text-xs py-2 px-4"
          >
            Submit
          </button>
          <button
            onClick={() => setState('idle')}
            className="btn-ghost text-xs py-2 px-4"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`mt-3 flex gap-3 transition-opacity duration-200 ${state === 'idle' ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
      <button
        onClick={() => { setState('up'); submitFeedback('up') }}
        className="text-xs text-text-faint hover:text-accent-light cursor-pointer transition-colors"
      >
        👍 Accurate
      </button>
      <button
        onClick={() => setState('correcting')}
        className="text-xs text-text-faint hover:text-accent-light cursor-pointer transition-colors"
      >
        ✏️ Correct
      </button>
    </div>
  )
}
