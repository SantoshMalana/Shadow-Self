'use client'
import { useEffect, useState } from 'react'

interface CloneAvatarProps {
  name: string
  isSpeaking?: boolean
  completeness?: number
}

export default function CloneAvatar({ name, isSpeaking = false, completeness = 0 }: CloneAvatarProps) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isSpeaking) return
    const id = setInterval(() => setTick(t => t + 1), 120)
    return () => clearInterval(id)
  }, [isSpeaking])

  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '◈'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>

      {/* Avatar */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Outer pulse ring when speaking */}
        {isSpeaking && (
          <div style={{
            position: 'absolute',
            width: '88px', height: '88px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.08)',
            animation: 'pulse 2s ease infinite'
          }} />
        )}

        {/* Main circle */}
        <div style={{
          width: '72px', height: '72px',
          borderRadius: '50%',
          background: isSpeaking ? '#141414' : '#0f0f0f',
          border: `1px solid ${isSpeaking ? '#333' : '#1e1e1e'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s ease',
          boxShadow: isSpeaking ? '0 0 24px rgba(255,255,255,0.04)' : 'none'
        }}>
          <span style={{
            fontSize: '20px', fontWeight: '300',
            letterSpacing: '0.1em',
            color: isSpeaking ? '#c0c0c0' : '#555',
            transition: 'color 0.3s ease'
          }}>
            {initials}
          </span>
        </div>

        {/* Progress arc */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          width="72" height="72" viewBox="0 0 72 72"
        >
          {completeness > 0 && (
            <circle
              cx="36" cy="36" r="34"
              fill="none"
              stroke={completeness > 70 ? '#444' : '#2a2a2a'}
              strokeWidth="1"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 34}
              strokeDashoffset={(2 * Math.PI * 34) * (1 - completeness / 100)}
              transform="rotate(-90 36 36)"
              style={{ transition: 'stroke-dashoffset 1.2s ease' }}
            />
          )}
        </svg>
      </div>

      {/* Name */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{
          fontSize: '15px', fontWeight: '400',
          letterSpacing: '0.12em', color: '#c0c0c0',
          textTransform: 'uppercase'
        }}>
          {name || 'Unknown'}
        </h2>
        <p style={{
          fontSize: '10px', letterSpacing: '0.1em',
          color: isSpeaking ? '#555' : '#2a2a2a',
          marginTop: '4px', transition: 'color 0.3s ease',
          textTransform: 'uppercase'
        }}>
          {isSpeaking ? 'speaking' : `${completeness}% trained`}
        </p>
      </div>

      {/* Voice visualizer */}
      {isSpeaking && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '16px' }}>
          {Array.from({ length: 10 }).map((_, i) => {
            const h = 3 + Math.abs(Math.sin((tick + i) * 0.7)) * 12
            return (
              <div key={i} style={{
                width: '2px',
                height: `${h}px`,
                background: '#333',
                borderRadius: '1px',
                transition: 'height 0.12s ease'
              }} />
            )
          })}
        </div>
      )}
    </div>
  )
}
