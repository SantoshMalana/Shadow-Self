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
        <div className="max-w-[75%] px-5 py-3.5 rounded-2xl rounded-tr-sm bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700/50 text-neutral-200 text-[15px] leading-relaxed shadow-lg shadow-black/20 break-words">
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
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
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
      <div className="mt-2 text-[11px] text-neutral-600">
        ✓ Feedback recorded
      </div>
    )
  }

  if (state === 'correcting') {
    return (
      <div className="mt-3 flex flex-col gap-2">
        <textarea
          value={correction}
          onChange={e => setCorrection(e.target.value)}
          placeholder="What should the response have said instead?"
          rows={2}
          className="w-full px-3 py-2 text-[13px] bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-300 resize-y focus:outline-none focus:border-neutral-700 placeholder:text-neutral-600"
        />
        <div className="flex gap-2">
          <button
            onClick={() => submitFeedback('down', correction)}
            className="px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-neutral-200 cursor-pointer transition-colors"
          >
            Submit
          </button>
          <button
            onClick={() => setState('idle')}
            className="px-3 py-1.5 text-xs bg-transparent border border-neutral-800 rounded-lg text-neutral-500 hover:text-neutral-400 cursor-pointer transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`mt-2 flex gap-1.5 transition-opacity duration-200 ${state === 'idle' ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
      <button
        onClick={() => { setState('up'); submitFeedback('up') }}
        title="Good response"
        className={`bg-transparent border-none cursor-pointer text-sm p-1 transition-colors ${state === 'up' ? 'text-green-400' : 'text-neutral-600 hover:text-neutral-400'}`}
      >
        👍
      </button>
      <button
        onClick={() => setState('correcting')}
        title="Bad response — provide correction"
        className={`bg-transparent border-none cursor-pointer text-sm p-1 transition-colors ${state === 'down' ? 'text-red-400' : 'text-neutral-600 hover:text-neutral-400'}`}
      >
        👎
      </button>
    </div>
  )
}
