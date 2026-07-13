'use client'

import { useState } from 'react'
import styles from './ChatBubble.module.css'
import btnStyles from './Buttons.module.css'

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
      <div className={`${styles.ssMessage} flex justify-end mb-8`}>
        <div className="max-w-[82%] px-4.5 py-3 rounded-[var(--radius-md)] rounded-br-sm bg-accent/15 border border-accent/25 text-text-primary text-[15px] leading-[1.7] break-words">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.ssMessage} flex gap-3.5 mb-9 max-w-[90%]`}>
      {/* Avatar */}
      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1" style={{ background: 'radial-gradient(circle at 32% 28%, #ffffff, #c084fc 35%, #8328f9 78%)' }}>
        <span className="text-[11px] text-white font-bold">◈</span>
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2 mb-2">
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
          {memoriesUsed && memoriesUsed > 0 && (
            <span className="text-[10px] px-2 py-0.5 bg-surface border border-border text-text-muted rounded-full flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              Recalled {memoriesUsed}
            </span>
          )}
          {transparencyTag && tagStyles[transparencyTag] && (
            <span className={`text-[10px] px-2 py-0.5 ${tagStyles[transparencyTag].bg} border ${tagStyles[transparencyTag].border} ${tagStyles[transparencyTag].text} rounded-full font-medium`}>
              {tagStyles[transparencyTag].label}
            </span>
          )}
        </div>

        <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-5 py-3.5">
          <div className="text-[15px] text-text-primary leading-[1.7] whitespace-pre-wrap break-words">
            {isTyping ? (
              <span className="flex gap-1.5 items-center py-2 h-6">
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
              </span>
            ) : cleanContent}
          </div>
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
          className="w-full px-4 py-3 text-[13px] bg-bg border border-border text-text-primary resize-y focus:outline-none focus:border-accent placeholder:text-text-faint rounded-[var(--radius-md)]"
        />
        <div className="flex gap-2">
          <button
            onClick={() => submitFeedback('down', correction)}
            className={`${btnStyles.btnPill} text-xs py-2 px-4`}
          >
            Submit
          </button>
          <button
            onClick={() => setState('idle')}
            className={`${btnStyles.btnGhost} text-xs py-2 px-4`}
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
        className="text-xs text-text-faint hover:text-accent-light cursor-pointer transition-colors flex items-center gap-1.5"
      >
        👍 Accurate
      </button>
      <button
        onClick={() => setState('correcting')}
        className="text-xs text-text-faint hover:text-accent-light cursor-pointer transition-colors flex items-center gap-1.5"
      >
        ✏️ Correct
      </button>
    </div>
  )
}