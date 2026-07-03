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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <div style={{
          maxWidth: '72%',
          padding: '12px 18px',
          borderRadius: '18px 18px 4px 18px',
          background: '#1a1a1a',
          border: '1px solid #252525',
          color: '#e8e8e8',
          fontSize: '15px',
          lineHeight: '1.6',
          wordBreak: 'break-word'
        }}>
          {content}
        </div>
      </div>
    )
  }

  // Assistant bubble
  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', maxWidth: '88%' }}>
      {/* Avatar dot */}
      <div style={{
        flexShrink: 0,
        width: '28px', height: '28px',
        borderRadius: '50%',
        background: '#111',
        border: '1px solid #252525',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', color: '#555',
        marginTop: '2px'
      }}>
        {mode === 'clone' ? '◈' : '✦'}
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#555', letterSpacing: '0.01em' }}>
            {assistantName}
          </span>
          {turnGoal && (
            <span style={{
              fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
              background: '#1a1a1a', border: '1px solid #333', color: '#888',
              fontFamily: 'monospace'
            }}>
              [Goal: {turnGoal}]
            </span>
          )}
        </div>
        <div style={{
          fontSize: '15px', color: '#d8d8d8', lineHeight: '1.7',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word'
        }}>
          {isTyping ? (
            <span style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 0' }}>
              {[0, 150, 300].map(delay => (
                <span
                  key={delay}
                  className="typing-dot"
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
    <div style={{ marginTop: '8px', display: 'flex', gap: '6px', opacity: state === 'idle' ? 0.4 : 1, transition: 'opacity 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={e => { if (state === 'idle') e.currentTarget.style.opacity = '0.4' }}
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
