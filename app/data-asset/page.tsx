'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ProvenancedItem {
  value: string
  sourceId: string
  timestamp: string
  sourcePreview: string | null
}

interface Journey {
  situation: string
  optionsConsidered: string[]
  actionTaken: string
  rationale: string
  sourceId: string
  timestamp: string
}

interface ConsentEntry {
  stream: string
  consented: boolean
  timestamp: string
  ipAddress: string | null
}

interface DataAsset {
  personality: { sessions: number; version: number; completeness: number }
  journeys: Journey[]
  provenanceChain: {
    tones: ProvenancedItem[]
    values: ProvenancedItem[]
    opinions: ProvenancedItem[]
    vocabulary: ProvenancedItem[]
    passionTopics: ProvenancedItem[]
    knowledgeDomains: ProvenancedItem[]
  }
  consents: ConsentEntry[]
}

function ProvenanceTag({ item, expanded, onToggle }: { item: ProvenancedItem; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="group">
      <button
        onClick={onToggle}
        className="w-full text-left bg-surface hover:bg-card border border-border rounded-xl px-3.5 py-2.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-light"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-text-primary font-medium capitalize">{item.value}</span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
            <span className="text-[10px] text-text-faint">
              {new Date(item.timestamp).toLocaleDateString()}
            </span>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`text-text-faint transition-transform ${expanded ? 'rotate-180' : ''}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
      </button>
      {expanded && item.sourcePreview && (
        <div className="mt-1.5 ml-3 pl-3 border-l-2 border-accent/30 py-2 animate-[fadeIn_0.2s_ease-out]">
          <p className="text-[11px] text-text-faint uppercase tracking-wider mb-1">Source Message</p>
          <p className="text-xs text-text-muted italic leading-relaxed">"{item.sourcePreview}"</p>
        </div>
      )}
    </div>
  )
}

function JourneyCard({ journey }: { journey: Journey }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-light"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary font-medium leading-snug">{journey.situation}</p>
          <p className="text-[11px] text-text-faint mt-1">
            {new Date(journey.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-text-faint shrink-0 mt-1 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 animate-[fadeIn_0.2s_ease-out]">
          {journey.optionsConsidered.length > 0 && (
            <div>
              <p className="text-[11px] text-accent-light font-semibold uppercase tracking-wider mb-1.5">Options Considered</p>
              <ul className="space-y-1">
                {journey.optionsConsidered.map((opt, i) => (
                  <li key={i} className="text-xs text-text-muted flex items-start gap-2">
                    <span className="text-text-faint mt-0.5">•</span>
                    {opt}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {journey.actionTaken && (
            <div>
              <p className="text-[11px] text-green-400/80 font-semibold uppercase tracking-wider mb-1">Action Taken</p>
              <p className="text-xs text-text-primary">{journey.actionTaken}</p>
            </div>
          )}
          {journey.rationale && (
            <div>
              <p className="text-[11px] text-amber-400/80 font-semibold uppercase tracking-wider mb-1">Rationale</p>
              <p className="text-xs text-text-muted italic">"{journey.rationale}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ConsentTimeline({ entries }: { entries: ConsentEntry[] }) {
  if (entries.length === 0) return <p className="text-sm text-text-faint">No consent events recorded yet.</p>
  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
      {entries.map((e, i) => (
        <div key={i} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${e.consented ? 'bg-green-500' : 'bg-red-400'}`} />
          <div className="flex-1 min-w-0">
            <span className="text-xs text-text-primary font-medium capitalize">{e.stream}</span>
            <span className="text-xs text-text-faint ml-2">
              {e.consented ? 'granted' : 'revoked'}
            </span>
          </div>
          <span className="text-[10px] text-text-faint shrink-0">
            {new Date(e.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function DataAssetPage() {
  const [data, setData] = useState<DataAsset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'provenance' | 'journeys' | 'consents'>('provenance')

  useEffect(() => {
    fetch('/api/data-asset')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load data asset')
        return r.json()
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  const toggleExpand = (key: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const allProvenance = data ? [
    ...data.provenanceChain.tones.map(t => ({ ...t, category: 'Tone' })),
    ...data.provenanceChain.values.map(t => ({ ...t, category: 'Value' })),
    ...data.provenanceChain.opinions.map(t => ({ ...t, category: 'Opinion' })),
    ...data.provenanceChain.passionTopics.map(t => ({ ...t, category: 'Passion' })),
    ...data.provenanceChain.knowledgeDomains.map(t => ({ ...t, category: 'Domain' })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : []

  return (
    <div className="min-h-screen bg-bg text-text-primary font-sans">
      {/* Header */}
      <header className="border-b border-border bg-bg/80 backdrop-blur-md px-6 sm:px-10 h-[60px] flex items-center gap-4 sticky top-0 z-20">
        <Link href="/settings" className="text-text-muted hover:text-text-primary transition-colors flex items-center gap-2 font-medium">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Settings
        </Link>
        <div className="w-px h-4 bg-border" />
        <span className="font-semibold text-text-primary tracking-wide">Your Data Asset</span>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="ss-card p-6 border-red-900/30 bg-red-950/20 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Sessions', value: data.personality.sessions },
                { label: 'Profile v', value: data.personality.version },
                { label: 'Completeness', value: `${data.personality.completeness}%` },
                { label: 'Decisions', value: data.journeys.length },
              ].map(s => (
                <div key={s.label} className="ss-card p-4 text-center">
                  <p className="text-2xl font-light text-text-primary">{s.value}</p>
                  <p className="text-[11px] text-text-faint uppercase tracking-wider mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-surface rounded-xl p-1">
              {(['provenance', 'journeys', 'consents'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all capitalize focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-light ${
                    activeTab === tab
                      ? 'bg-card text-text-primary shadow-sm'
                      : 'text-text-faint hover:text-text-muted'
                  }`}
                >
                  {tab === 'provenance' ? 'Cognitive Provenance' : tab === 'journeys' ? `Decisions (${data.journeys.length})` : 'Consent Log'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'provenance' && (
              <div className="space-y-2">
                {allProvenance.length === 0 ? (
                  <div className="ss-card p-8 text-center">
                    <p className="text-text-faint text-sm">No provenanced traits yet. Chat more to build your cognitive profile!</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-text-faint mb-3">
                      Every trait below links back to the exact message that generated it. Click to expand.
                    </p>
                    {allProvenance.map((item, i) => {
                      const key = `${item.category}-${item.value}-${i}`
                      return (
                        <div key={key} className="flex items-start gap-3">
                          <span className="text-[10px] text-text-faint uppercase tracking-wider w-16 shrink-0 pt-3 text-right">{item.category}</span>
                          <div className="flex-1">
                            <ProvenanceTag
                              item={item}
                              expanded={expandedItems.has(key)}
                              onToggle={() => toggleExpand(key)}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            )}

            {activeTab === 'journeys' && (
              <div className="space-y-3">
                {data.journeys.length === 0 ? (
                  <div className="ss-card p-8 text-center">
                    <p className="text-text-faint text-sm">No decisions captured yet. When you describe how you solved a problem or made a choice, it will appear here.</p>
                  </div>
                ) : (
                  data.journeys.map((j, i) => <JourneyCard key={i} journey={j} />)
                )}
              </div>
            )}

            {activeTab === 'consents' && (
              <div className="ss-card p-6">
                <h3 className="text-sm font-medium text-text-faint uppercase tracking-widest mb-4">Consent History</h3>
                <ConsentTimeline entries={data.consents} />
                <p className="text-[10px] text-text-faint mt-4">
                  This is an immutable, append-only log. Every consent change is permanently recorded for your protection.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
