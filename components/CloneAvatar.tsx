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
    <div className="flex flex-col items-center gap-5">
      {/* Avatar */}
      <div className="relative flex items-center justify-center">
        {/* Main circle */}
        <div className={`w-[76px] h-[76px] flex items-center justify-center transition-all duration-500 rounded-sm ${
          isSpeaking 
            ? 'bg-accent-brass border-[#A99360]' 
            : 'bg-surface border-[#2A2630]'
        } border dynamic-shadow`}>
          <span className={`font-display text-2xl transition-colors duration-500 ${
            isSpeaking ? 'text-[#17161B]' : 'text-text-primary'
          }`}>
            {initials}
          </span>
        </div>

        {/* Progress arc */}
        <svg
          className="absolute top-0 left-0 pointer-events-none"
          width="76" height="76" viewBox="0 0 76 76"
        >
          {completeness > 0 && (
            <circle
              cx="38" cy="38" r="36"
              fill="none"
              stroke={completeness > 70 ? '#9C8552' : '#2A2630'}
              strokeWidth="2"
              strokeDasharray={2 * Math.PI * 36}
              strokeDashoffset={(2 * Math.PI * 36) * (1 - completeness / 100)}
              transform="rotate(-90 38 38)"
              className="transition-[stroke-dashoffset] duration-[1.5s] ease-out"
            />
          )}
        </svg>
      </div>

      {/* Name */}
      <div className="text-center">
        <h2 className="font-display text-[16px] tracking-wide text-text-primary mb-1">
          {name || 'Unknown'}
        </h2>
        <p className={`font-mono text-[10px] tracking-widest uppercase transition-colors duration-300 ${
          isSpeaking ? 'text-accent-brass' : 'text-text-muted'
        }`}>
          {isSpeaking ? '[GENERATING]' : `[${completeness}% TRAINED]`}
        </p>
      </div>

      {/* Voice visualizer */}
      {isSpeaking && (
        <div className="flex items-center gap-1 h-[20px] mt-2">
          {Array.from({ length: 12 }).map((_, i) => {
            const h = 4 + Math.abs(Math.sin((tick + i) * 0.8)) * 16
            return (
              <div key={i} className="w-[3px] bg-accent-brass transition-all duration-[120ms] ease-out rounded-sm"
                style={{ height: `${h}px` }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
