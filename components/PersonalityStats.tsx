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
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '11px', color: '#555' }}>{label}</span>
        <span style={{ fontSize: '11px', color: '#888', fontWeight: '500' }}>{value}/{max}</span>
      </div>
      <div style={{ height: '2px', background: '#1a1a1a', borderRadius: '1px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: pct > 60 ? '#d0d0d0' : pct > 30 ? '#666' : '#333',
          borderRadius: '1px',
          transition: 'width 0.8s ease'
        }} />
      </div>
    </div>
  )
}

export default function PersonalityStats({ personality, completeness }: PersonalityStatsProps) {
  const r = 22
  const circ = 2 * Math.PI * r
  const offset = circ - (completeness / 100) * circ

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Ring */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r={r} fill="none" stroke="#1a1a1a" strokeWidth="3" />
            <circle
              cx="26" cy="26" r={r}
              fill="none" stroke={completeness > 60 ? '#d0d0d0' : '#444'} strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              transform="rotate(-90 26 26)"
              style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#d0d0d0' }}>{completeness}%</span>
          </div>
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: '500', color: '#d0d0d0', marginBottom: '2px' }}>Clone Completeness</p>
          <p style={{ fontSize: '11px', color: '#444' }}>
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
          <p style={{ fontSize: '10px', color: '#333', letterSpacing: '0.08em', marginBottom: '8px' }}>DETECTED TONES</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {personality.communicationStyle.tone.slice(0, 5).map((t, i) => (
              <span key={i} style={{
                padding: '3px 10px', borderRadius: '4px',
                background: '#111', border: '1px solid #1e1e1e',
                fontSize: '11px', color: '#666', textTransform: 'capitalize'
              }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {(personality.knowledgeDomains?.length || 0) > 0 && (
        <div>
          <p style={{ fontSize: '10px', color: '#333', letterSpacing: '0.08em', marginBottom: '8px' }}>KNOWLEDGE</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {personality.knowledgeDomains.slice(0, 4).map((d, i) => (
              <span key={i} style={{
                padding: '3px 10px', borderRadius: '4px',
                background: '#111', border: '1px solid #1e1e1e',
                fontSize: '11px', color: '#666', textTransform: 'capitalize'
              }}>
                {d}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
