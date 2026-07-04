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
}

export default function ChatBubble({ role, content, mode, name, isTyping, turnGoal, messageId }: ChatBubbleProps) {
  const isUser = role === 'user'
  const assistantName = mode === 'clone' ? (name || 'Clone') : 'Shadow Shelf'

  if (isUser) {
    return (
      <div className="ss-message flex justify-end mb-6">
        <div className="max-w-[75%] px-5 py-3.5 rounded-2xl rounded-tr-sm bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700/50 text-[#e8e8e8] text-[15px] leading-relaxed shadow-lg shadow-black/20 break-words">
          {content}
        </div>
      </div>
    )
  }

  // Assistant bubble
  return (
    <div className="ss-message flex gap-4 mb-8 max-w-[90%]">
      {/* Avatar dot */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neutral-800 to-black border border-neutral-700 flex items-center justify-center text-xs text-neutral-400 mt-1 shadow-inner shadow-white/5">
        {mode === 'clone' ? '◈' : '✦'}
      </div>

      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-neutral-400 tracking-wide uppercase">
            {assistantName}
          </span>
          {turnGoal && process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-black border border-neutral-800 text-neutral-500 font-mono">
              [Goal: {turnGoal}]
            </span>
          )}
        </div>
        
        <div className="text-[15px] text-neutral-300 leading-[1.75] whitespace-pre-wrap break-words font-light">
          {isTyping ? (
            <span className="flex gap-1.5 items-center py-2 h-6">
              {[0, 150, 300].map(delay => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full bg-blue-500/60 animate-pulse"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </span>
          ) : content}
        </div>
        
        {/* Feedback UI — only on assistant messages that aren't typing */}
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
      <div style={{ marginTop: '8px', fontSize: '11px', color: '#555' }}>
        ✓ Feedback recorded
      </div>
    )
  }

  if (state === 'correcting') {
    return (
      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <textarea
          value={correction}
          onChange={e => setCorrection(e.target.value)}
          placeholder="What should the response have said instead?"
          rows={2}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '13px',
            background: '#0d0d0d',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#ddd',
            resize: 'vertical',
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => submitFeedback('down', correction)}
            style={{
              padding: '4px 12px', fontSize: '12px',
              background: '#1a1a1a', border: '1px solid #333',
              borderRadius: '6px', color: '#e0e0e0', cursor: 'pointer'
            }}
          >
            Submit
          </button>
          <button
            onClick={() => setState('idle')}
            style={{
              padding: '4px 12px', fontSize: '12px',
              background: 'transparent', border: '1px solid #252525',
              borderRadius: '6px', color: '#666', cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '8px', display: 'flex', gap: '6px', opacity: state === 'idle' ? 0.65 : 1, transition: 'opacity 0.2s' }}
      className="feedback-buttons"
      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={e => { if (state === 'idle') e.currentTarget.style.opacity = '0.65' }}
    >
      <button
        onClick={() => { setState('up'); submitFeedback('up') }}
        title="Good response"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '14px', padding: '2px 4px', color: state === 'up' ? '#4ade80' : '#777',
        }}
      >
        👍
      </button>
      <button
        onClick={() => setState('correcting')}
        title="Bad response — provide correction"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '14px', padding: '2px 4px', color: state === 'down' ? '#f87171' : '#777',
        }}
      >
        👎
      </button>
    </div>
  )
}
