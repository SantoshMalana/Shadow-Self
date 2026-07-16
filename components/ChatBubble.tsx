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
  memoriesUsed?: number
  depthRung?: 1 | 2 | 3 | 4 | 5
}

export default function ChatBubble({ role, content, mode, name, isTyping, turnGoal, messageId, memoriesUsed, depthRung = 1 }: ChatBubbleProps) {
  const isUser = role === 'user'
  const assistantName = mode === 'clone' ? (name || 'Clone') : 'Shadow Shelf'

  // Parse Output Composer transparency tags from clone responses
  const tagMatch = !isUser ? content.match(/^\[(GROUNDED|INFERRED|REFUSED)\]\s*/i) : null
  const transparencyTag = tagMatch ? tagMatch[1].toUpperCase() as 'GROUNDED' | 'INFERRED' | 'REFUSED' : null
  const cleanContent = tagMatch ? content.slice(tagMatch[0].length) : content

  const tagStyles: Record<string, { bg: string; border: string; text: string; label: string }> = {
    GROUNDED: { bg: 'bg-emerald-950/50', border: 'border-emerald-700/40', text: 'text-emerald-400', label: '◆ Grounded' },
    INFERRED: { bg: 'bg-amber-950/50', border: 'border-amber-700/40', text: 'text-amber-400', label: '◇ Inferred' },
    REFUSED:  { bg: 'bg-red-950/50', border: 'border-red-700/40', text: 'text-red-400', label: '✕ Refused' },
  }

  if (isUser) {
    return (
      <div className={`ssMessage flex justify-end mb-10`}>
        <div className="max-w-[82%] px-5 py-3.5 rounded-[var(--radius-lg)] rounded-br-sm bg-accent/15 border border-accent/25 text-text-primary text-[15px] leading-[1.7] break-words shadow-sm">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="ssMessage group flex gap-4 mb-12 max-w-[95%]">
      {/* Avatar */}
      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 shadow-sm" style={{ background: 'radial-gradient(circle at 32% 28%, #ffffff, #c084fc 35%, var(--color-accent) 78%)' }}>
        <span className="text-[11px] text-white font-bold tracking-tighter">◈</span>
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[13px] font-semibold text-text-primary">
            {assistantName}
          </span>
          {turnGoal && process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' && (
            <span className="text-[10px] px-2 py-0.5 bg-[var(--color-accent)]/20 text-[var(--color-accent-text)] rounded-full font-mono">
              {turnGoal}
            </span>
          )}
          {depthRung > 1 && (
             <span className="text-[10px] px-2 py-0.5 bg-[var(--color-accent-purple)]/10 text-[var(--color-accent-purple)] rounded-full font-mono">
             Rung {depthRung}
           </span>
          )}
          {memoriesUsed && memoriesUsed > 0 && (
            <span className="text-[10px] px-2 py-0.5 bg-surface text-text-muted rounded-full flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              Recalled {memoriesUsed}
            </span>
          )}
          {transparencyTag && tagStyles[transparencyTag] && (
            <span className={`text-[10px] px-2 py-0.5 ${tagStyles[transparencyTag].bg} ${tagStyles[transparencyTag].text} rounded-full font-medium`}>
              {tagStyles[transparencyTag].label}
            </span>
          )}
        </div>

        <div className="pt-0.5">
          <div className="text-[15px] text-text-primary leading-[1.75] whitespace-pre-wrap break-words">
            {isTyping ? (
              <span className="flex gap-1.5 items-center py-2 h-6">
                <span className="typingDot" />
                <span className="typingDot" />
                <span className="typingDot" />
              </span>
            ) : cleanContent}
          </div>
        </div>

        {/* Hover-to-reveal controls */}
        {!isTyping && messageId && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <FeedbackButtons messageId={messageId} />
          </div>
        )}
      </div>
    </div>
  )
}

function FeedbackButtons({ messageId }: { messageId: string }) {
  const [state, setState] = useState<'idle' | 'up' | 'down' | 'correcting' | 'sent'>('idle')
  const [correction, setCorrection] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitFeedback = async (rating: 'up' | 'down', correctionText?: string) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, rating, correctionText })
      })
      setState('sent')
    } catch (err) {
      console.error('Feedback error:', err)
      setState('idle')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (state === 'sent') {
    return (
      <div className="mt-2.5 text-[11px] text-accent-light font-medium">
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
          disabled={isSubmitting}
          className="w-full px-4 py-3 text-[13px] bg-bg border border-border text-text-primary resize-y focus:outline-none focus:border-accent placeholder:text-text-faint rounded-[var(--radius-md)] disabled:opacity-50"
        />
        <div className="flex gap-2">
          <button
            onClick={() => submitFeedback('down', correction)}
            disabled={isSubmitting || !correction.trim()}
            className={`btnPill text-xs py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? 'Submitting…' : 'Submit'}
          </button>
          <button
            onClick={() => setState('idle')}
            disabled={isSubmitting}
            className={`btnGhost text-xs py-2 px-4 disabled:opacity-50`}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 flex gap-4">
      <button
        onClick={() => { setState('up'); submitFeedback('up') }}
        disabled={isSubmitting}
        className="text-xs text-text-faint hover:text-accent-light cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        👍 Accurate
      </button>
      <button
        onClick={() => setState('correcting')}
        disabled={isSubmitting}
        className="text-xs text-text-faint hover:text-accent-light cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ✏️ Correct
      </button>
    </div>
  )
}