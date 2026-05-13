'use client'

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
  mode: string
  name?: string
  isTyping?: boolean
}

export default function ChatBubble({ role, content, mode, name, isTyping }: ChatBubbleProps) {
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
        <div style={{ fontSize: '12px', fontWeight: '500', color: '#555', marginBottom: '6px', letterSpacing: '0.01em' }}>
          {assistantName}
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
      </div>
    </div>
  )
}
