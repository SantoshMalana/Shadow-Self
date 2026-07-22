'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import SignOutButton from '@/components/SignOutButton'

const STREAMS = [
  {
    key: 'voice',
    label: 'Voice Recording',
    description: 'Allow ElevenLabs voice synthesis and Whisper transcription.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
      </svg>
    )
  },
  {
    key: 'text',
    label: 'Text Conversations',
    description: 'Store and use your chat messages for personality learning.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    )
  },
  {
    key: 'memory',
    label: 'Memory Storage',
    description: 'Persist extracted memories in the vector database for recall.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    )
  },
  {
    key: 'personality',
    label: 'Personality Profiling',
    description: 'Extract and store cognitive and emotional traits from conversations.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    )
  },
]

type Section = 'profile' | 'api-keys' | 'data' | 'consent' | 'danger'

const sections: { id: Section, label: string, icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { id: 'api-keys', label: 'API Keys', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg> },
  { id: 'data', label: 'Your Data', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg> },
  { id: 'consent', label: 'Consent & Privacy', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { id: 'danger', label: 'Danger Zone', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg> },
]

function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-10 h-5.5 h-[22px] rounded-full transition-colors duration-200 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-purple)] ${on ? 'bg-[var(--color-accent-purple)]' : 'bg-border'} ${disabled ? 'opacity-50' : ''}`}
    >
      <span
        className="absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: on ? 'translateX(18px)' : 'translateX(0)' }}
      />
    </button>
  )
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] flex items-center justify-center text-text-muted">
          {icon}
        </div>
        <h2 className="font-semibold text-text-primary">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('profile')
  const [consents, setConsents] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [apiKeyCopied, setApiKeyCopied] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    fetch('/api/consent')
      .then(r => r.json())
      .then(data => {
        setConsents(data.consents || {})
        setLoading(false)
      })
      .catch(() => setLoading(false))

    fetch('/api/user/apikey')
      .then(r => r.json())
      .then(data => setApiKey(data.apiKey))
      .catch(console.error)

    fetch('/api/user/profile')
      .then(r => r.json())
      .then(data => {
        setUserName(data.name || '')
        setUserEmail(data.email || '')
      })
      .catch(console.error)
  }, [])

  const generateApiKey = async () => {
    try {
      const res = await fetch('/api/user/apikey', { method: 'POST' })
      const data = await res.json()
      setApiKey(data.apiKey)
    } catch (err) { console.error(err) }
  }

  const copyApiKey = () => {
    if (!apiKey) return
    navigator.clipboard.writeText(apiKey)
    setApiKeyCopied(true)
    setTimeout(() => setApiKeyCopied(false), 2000)
  }

  const toggleConsent = async (stream: string) => {
    const newValue = !consents[stream]
    setSaving(stream)
    try {
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stream, consented: newValue }),
      })
      setConsents(prev => ({ ...prev, [stream]: newValue }))
    } catch (err) { console.error('Consent toggle error:', err) }
    setSaving(null)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/account/export')
      if (!res.ok) throw new Error('Export request failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `shadow-shelf-export-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      alert('Export failed. Please try again.')
    }
    setExporting(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Deletion failed')
      window.location.href = '/login'
    } catch (err) {
      console.error('Delete error:', err)
      alert('Something went wrong deleting your account.')
      setDeleting(false)
    }
  }

  return (
    <div className="h-screen flex bg-bg font-sans text-text-primary overflow-hidden">
      {/* Global Sidebar */}
      <Sidebar />

      {/* Settings Inner Layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* Settings Nav Panel */}
        <div className="hidden md:flex w-[220px] shrink-0 border-r border-border flex-col bg-bg">
          <div className="px-4 h-[60px] flex items-center border-b border-border shrink-0">
            <span className="font-semibold text-text-primary text-sm">Settings</span>
          </div>
          <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all duration-150 w-full ${
                  activeSection === s.id
                    ? 'bg-[var(--color-surface)] text-text-primary'
                    : 'text-text-muted hover:text-text-primary hover:bg-[var(--color-surface)]/60'
                } ${s.id === 'danger' ? 'text-red-500 hover:text-red-600 mt-auto' : ''}`}
              >
                <span className={s.id === 'danger' && activeSection !== s.id ? 'text-red-400' : ''}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-border shrink-0">
            <SignOutButton />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Top header */}
          <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-border px-8 h-[60px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-text-primary text-sm">
                {sections.find(s => s.id === activeSection)?.label}
              </h1>
            </div>
            {activeSection === 'data' && (
              <button
                onClick={handleExport}
                disabled={exporting}
                className="btnPrimary text-sm"
              >
                {exporting ? 'Exporting…' : 'Export All Data'}
              </button>
            )}
          </header>

          <div className="max-w-2xl mx-auto px-8 py-8 flex flex-col gap-5">

            {/* ── Profile ── */}
            {activeSection === 'profile' && (
              <>
                <SectionCard title="Your Profile" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                      >
                      {userName ? userName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <div className="font-semibold text-text-primary">{userName || 'Not set'}</div>
                      <div className="text-sm text-text-muted">{userEmail || 'No email'}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-text-faint uppercase tracking-wider mb-1.5 block">Display Name</label>
                      <input
                        type="text"
                        defaultValue={userName}
                        className="w-full bg-[var(--color-surface)] border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-[var(--color-accent-purple)]/50 transition-colors"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-faint uppercase tracking-wider mb-1.5 block">Email</label>
                      <input
                        type="email"
                        defaultValue={userEmail}
                        readOnly
                        className="w-full bg-[var(--color-surface)] border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-muted focus:outline-none cursor-not-allowed"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <Link href="/profile" className="text-sm text-[var(--color-accent-purple)] font-medium hover:underline">
                      View full cognitive profile →
                    </Link>
                  </div>
                </SectionCard>
              </>
            )}

            {/* ── API Keys ── */}
            {activeSection === 'api-keys' && (
              <>
                <SectionCard title="VS Code Extension Key" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>}>
                  <p className="text-sm text-text-muted mb-4">Use this key to connect the Shadow Shelf VS Code extension. Keep it secret — treat it like a password.</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-[var(--color-surface)] border border-border rounded-xl px-3.5 py-2.5">
                      <code className="flex-1 text-sm font-mono text-text-primary truncate">
                        {apiKey || 'No key generated yet'}
                      </code>
                      {apiKey && (
                        <button onClick={copyApiKey} className="text-xs font-medium text-[var(--color-accent-purple)] hover:underline shrink-0">
                          {apiKeyCopied ? 'Copied!' : 'Copy'}
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={generateApiKey}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
                      >
                        {apiKey ? 'Regenerate Key' : 'Generate Key'}
                      </button>
                    </div>
                    {apiKey && (
                      <p className="text-xs text-text-faint">⚠ Regenerating will invalidate your current key and disconnect existing integrations.</p>
                    )}
                  </div>
                </SectionCard>

                <div className="bg-[var(--color-surface)] border border-border rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-text-primary text-sm mb-1">API Key Usage</div>
                      <div className="text-xs text-text-muted">Key usage tracking coming soon.</div>
                    </div>
                    <div className="px-3 py-1.5 bg-border/50 rounded-full text-xs text-text-faint font-medium">
                      Coming soon
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Your Data ── */}
            {activeSection === 'data' && (
              <>
                <div className="bg-[var(--color-surface)] border border-border rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent-purple)] shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-text-primary text-sm">Your data is encrypted and private.</div>
                    <div className="text-xs text-text-muted mt-0.5">We never sell or share your data with third parties.</div>
                  </div>
                  <div className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200 shrink-0">Protected</div>
                </div>

                <SectionCard title="Cognitive Profile Data" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>}>
                  <p className="text-sm text-text-muted mb-4">View and explore your stored cognitive profile — personality traits, memories, communication style, and more.</p>
                  <Link href="/data-asset" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent-soft)]/50 text-[var(--color-accent-deep)] border border-[var(--color-accent-purple)]/20 rounded-xl text-sm font-medium hover:bg-[var(--color-accent-soft)] transition-colors">
                    Open Data Dashboard
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                </SectionCard>

                <SectionCard title="Export Your Data" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}>
                  <p className="text-sm text-text-muted mb-4">Download a complete export of all your data stored in Shadow Shelf in JSON format.</p>
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-primary hover:bg-surface transition-colors disabled:opacity-50"
                  >
                    {exporting ? 'Preparing export…' : 'Download JSON Export'}
                  </button>
                </SectionCard>
              </>
            )}

            {/* ── Consent & Privacy ── */}
            {activeSection === 'consent' && (
              <>
                <div className="text-sm text-text-muted bg-surface border border-border rounded-2xl px-5 py-4">
                  Control exactly what Shadow Shelf is allowed to store and process. Changes take effect immediately.
                </div>
                <SectionCard title="Data Processing Consent" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}>
                  {loading ? (
                    <div className="space-y-4">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="h-12 bg-surface rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {STREAMS.map(s => (
                        <div key={s.key} className="flex items-center justify-between gap-4 py-1">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-text-muted shrink-0 mt-0.5">
                              {s.icon}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text-primary">{s.label}</p>
                              <p className="text-xs text-text-muted leading-snug mt-0.5">{s.description}</p>
                            </div>
                          </div>
                          <Toggle
                            on={consents[s.key] || false}
                            onToggle={() => toggleConsent(s.key)}
                            disabled={saving === s.key}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>

                <div className="flex gap-3 text-xs text-text-faint">
                  <Link href="/privacy" className="hover:text-text-muted hover:underline transition-colors">Privacy Policy</Link>
                  <span>·</span>
                  <Link href="/terms" className="hover:text-text-muted hover:underline transition-colors">Terms of Service</Link>
                  <span>·</span>
                  <Link href="/safety" className="hover:text-text-muted hover:underline transition-colors">Safety</Link>
                </div>
              </>
            )}

            {/* ── Danger Zone ── */}
            {activeSection === 'danger' && (
              <>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0 mt-0.5"><path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                  <p className="text-sm text-red-700">The actions on this page are permanent and cannot be undone. Proceed with extreme caution.</p>
                </div>

                <div className="bg-white border border-red-200 rounded-2xl p-6">
                  <h3 className="font-semibold text-text-primary mb-1">Delete Account</h3>
                  <p className="text-sm text-text-muted mb-5">Permanently delete your account and all associated cognitive data, memories, and personality profiles. This action is irreversible.</p>
                  {!deleteConfirm ? (
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete My Account
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
                        Are you absolutely sure? This will delete everything permanently.
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDelete}
                          disabled={deleting}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {deleting ? 'Deleting…' : 'Yes, delete everything'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(false)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white border border-border text-text-muted hover:text-text-primary transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
