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
  onDeleteTrait?: (category: string, index: number) => void
}

function StatRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100)
  const barColor = pct > 60 ? 'bg-accent' : pct > 30 ? 'bg-accent-deep' : 'bg-text-faint/30'

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1.5 text-[11px]">
        <span className="text-text-faint font-medium">{label}</span>
        <span className="text-text-primary font-semibold">{value}/{max}</span>
      </div>
      <div className="h-1 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function PersonalityStats({ personality, completeness, onDeleteTrait }: PersonalityStatsProps) {
  const r = 22
  const circ = 2 * Math.PI * r
  const offset = circ - (completeness / 100) * circ

  return (
    <div className="w-full flex flex-col gap-6">

      {/* Ring */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r={r} fill="none" stroke="#2b2145" strokeWidth="2" />
            <circle
              cx="26" cy="26" r={r}
              fill="none"
              stroke={completeness > 60 ? '#8328f9' : '#4c1594'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              transform="rotate(-90 26 26)"
              style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-bold text-text-primary">{completeness}%</span>
          </div>
        </div>
        <div>
          <p className="text-[13px] text-text-primary font-semibold mb-0.5">Cognitive Profile</p>
          <p className="text-[11px] text-text-faint">
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
          <p className="text-[11px] text-accent-light font-semibold tracking-wider uppercase mb-2">Detected Tones</p>
          <div className="flex flex-wrap gap-1.5">
            {personality.communicationStyle.tone.slice(0, 5).map((t, i) => (
              <span
                key={i}
                className="bg-accent-soft border border-border text-text-primary pl-2.5 pr-1.5 py-1 text-[11px] rounded-full capitalize flex items-center gap-1 group"
              >
                {t}
                {onDeleteTrait && (
                  <button 
                    onClick={() => onDeleteTrait('communicationStyle.tone', i)}
                    className="text-text-faint hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove trait"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {(personality.knowledgeDomains?.length || 0) > 0 && (
        <div>
          <p className="text-[11px] text-accent-light font-semibold tracking-wider uppercase mb-2">Knowledge Domains</p>
          <div className="flex flex-wrap gap-1.5">
            {personality.knowledgeDomains.slice(0, 4).map((d, i) => (
              <span
                key={i}
                className="bg-accent-soft border border-border text-text-primary pl-2.5 pr-1.5 py-1 text-[11px] rounded-full capitalize flex items-center gap-1 group"
              >
                {d}
                {onDeleteTrait && (
                  <button 
                    onClick={() => onDeleteTrait('knowledgeDomains', i)}
                    className="text-text-faint hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove domain"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
