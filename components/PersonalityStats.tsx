'use client'

interface PersonalityData {
  sessions: number
  communicationStyle: { tone: string[]; vocabulary: string[]; explanationStyle: string }
  thinkingPatterns: { values: string[]; opinions: string[] }
  emotionalProfile: { passionTopics: string[] }
  knowledgeDomains: string[]
}

interface PersonalityStatsProps {
  personality: PersonalityData
  completeness: number
}

function StatRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100)
  const barColor = pct > 60 ? 'bg-accent-brass' : pct > 30 ? 'bg-accent-cold' : 'bg-text-muted/30'

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1.5 font-mono text-[10px] uppercase tracking-widest">
        <span className="text-text-muted">{label}</span>
        <span className="text-text-primary">{value}/{max}</span>
      </div>
      <div className="h-0.5 bg-[#2A2630] overflow-hidden">
        <div
          className={`h-full transition-[width] duration-700 ease-out ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function PersonalityStats({ personality, completeness }: PersonalityStatsProps) {
  const r = 22
  const circ = 2 * Math.PI * r
  const offset = circ - (completeness / 100) * circ

  return (
    <div className="w-full flex flex-col gap-6">

      {/* Ring */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r={r} fill="none" stroke="#2A2630" strokeWidth="2" />
            <circle
              cx="26" cy="26" r={r}
              fill="none"
              stroke={completeness > 60 ? '#9C8552' : '#4A5A6B'}
              strokeWidth="2"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              transform="rotate(-90 26 26)"
              style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-[11px] text-text-primary">{completeness}%</span>
          </div>
        </div>
        <div>
          <p className="font-sans text-[13px] text-text-primary mb-1">Cognitive Profile</p>
          <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest">
            {personality.sessions} session{personality.sessions !== 1 ? 's' : ''} logged
          </p>
        </div>
      </div>

      {/* Bars */}
      <div>
        <StatRow label="Tones" value={personality.communicationStyle?.tone?.length || 0} max={10} />
        <StatRow label="Values" value={personality.thinkingPatterns?.values?.length || 0} max={15} />
        <StatRow label="Opinions" value={personality.thinkingPatterns?.opinions?.length || 0} max={20} />
        <StatRow label="Passions" value={personality.emotionalProfile?.passionTopics?.length || 0} max={10} />
        <StatRow label="Domains" value={personality.knowledgeDomains?.length || 0} max={10} />
      </div>

      {/* Tags */}
      {(personality.communicationStyle?.tone?.length || 0) > 0 && (
        <div>
          <p className="font-mono text-[10px] text-accent-cold tracking-widest uppercase mb-2">Detected Tones</p>
          <div className="flex flex-wrap gap-1.5">
            {personality.communicationStyle.tone.slice(0, 5).map((t, i) => (
              <span
                key={i}
                className="bg-[#1C1A21] border border-[#2A2630] text-text-primary px-2 py-0.5 text-xs font-sans capitalize"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {(personality.knowledgeDomains?.length || 0) > 0 && (
        <div>
          <p className="font-mono text-[10px] text-accent-cold tracking-widest uppercase mb-2">Knowledge Domains</p>
          <div className="flex flex-wrap gap-1.5">
            {personality.knowledgeDomains.slice(0, 4).map((d, i) => (
              <span
                key={i}
                className="bg-[#1C1A21] border border-[#2A2630] text-text-primary px-2 py-0.5 text-xs font-sans capitalize"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
