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
  const barColor = pct > 60 ? 'bg-neutral-200' : pct > 30 ? 'bg-neutral-500' : 'bg-neutral-700'

  return (
    <div className="mb-3.5">
      <div className="flex justify-between mb-1">
        <span className="text-xs text-neutral-500">{label}</span>
        <span className="text-xs text-neutral-300 font-medium">{value}/{max}</span>
      </div>
      <div className="h-0.5 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${barColor}`}
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
    <div className="w-full flex flex-col gap-5">

      {/* Ring */}
      <div className="flex items-center gap-3.5">
        <div className="relative shrink-0">
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r={r} fill="none" stroke="#1a1a1a" strokeWidth="3" />
            <circle
              cx="26" cy="26" r={r}
              fill="none"
              stroke={completeness > 60 ? '#d0d0d0' : '#444'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              transform="rotate(-90 26 26)"
              style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-semibold text-neutral-200">{completeness}%</span>
          </div>
        </div>
        <div>
          <p className="text-[13px] font-medium text-neutral-200 mb-0.5">Clone Completeness</p>
          <p className="text-[11px] text-neutral-600">
            {personality.sessions} session{personality.sessions !== 1 ? 's' : ''}
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
          <p className="text-[11px] text-neutral-600 tracking-wider font-medium uppercase mb-2">Detected Tones</p>
          <div className="flex flex-wrap gap-1.5">
            {personality.communicationStyle.tone.slice(0, 5).map((t, i) => (
              <span
                key={i}
                className="bg-neutral-800 border border-neutral-800 text-neutral-400 rounded-md px-2 py-0.5 text-xs capitalize"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {(personality.knowledgeDomains?.length || 0) > 0 && (
        <div>
          <p className="text-[11px] text-neutral-600 tracking-wider font-medium uppercase mb-2">Knowledge</p>
          <div className="flex flex-wrap gap-1.5">
            {personality.knowledgeDomains.slice(0, 4).map((d, i) => (
              <span
                key={i}
                className="bg-neutral-800 border border-neutral-800 text-neutral-400 rounded-md px-2 py-0.5 text-xs capitalize"
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
