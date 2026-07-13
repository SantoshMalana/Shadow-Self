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
        {/* Outer pulse ring when speaking */}
        {isSpeaking && (
          <div className="absolute w-[96px] h-[96px] rounded-full border border-accent/30 animate-[pulse_2s_ease-in-out_infinite]" />
        )}

        {/* Main circle */}
        <div className={`w-[76px] h-[76px] rounded-full flex items-center justify-center transition-all duration-500 border ${
          isSpeaking 
            ? 'border-accent/50 shadow-[0_0_30px_rgba(131,40,249,0.25)] scale-105' 
            : 'border-border shadow-xl'
        }`} style={{ background: 'radial-gradient(circle at 32% 28%, var(--color-border), var(--color-card) 70%)' }}>
          <span className={`text-[22px] font-light tracking-[0.1em] transition-colors duration-500 ${
            isSpeaking ? 'text-accent-light' : 'text-text-faint'
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
              stroke={completeness > 70 ? 'var(--color-accent)' : 'var(--color-accent-deep)'}
              strokeWidth="1.5"
              strokeLinecap="round"
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
        <h2 className="text-[16px] font-semibold tracking-wide text-text-primary mb-1">
          {name || 'Unknown'}
        </h2>
        <p className={`text-[10px] tracking-[0.15em] uppercase transition-colors duration-300 ${
          isSpeaking ? 'text-accent-light animate-pulse' : 'text-text-faint'
        }`}>
          {isSpeaking ? 'generating response' : `${completeness}% trained`}
        </p>
      </div>

      {/* Voice visualizer */}
      {isSpeaking && (
        <div className="flex items-center gap-[3px] h-[20px] mt-2">
          {Array.from({ length: 12 }).map((_, i) => {
            const h = 4 + Math.abs(Math.sin((tick + i) * 0.8)) * 16
            return (
              <div key={i} className="w-[2px] bg-accent/60 rounded-full transition-all duration-[120ms] ease-out"
                style={{ height: `${h}px` }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
