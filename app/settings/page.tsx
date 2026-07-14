'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STREAMS = [
  { key: 'voice', label: 'Voice Recording', description: 'Allow ElevenLabs voice synthesis and Whisper transcription.' },
  { key: 'text', label: 'Text Conversations', description: 'Store and use your chat messages for personality learning.' },
  { key: 'memory', label: 'Memory Storage', description: 'Persist extracted memories in the vector database for recall.' },
  { key: 'personality', label: 'Personality Profiling', description: 'Extract and store cognitive/emotional traits from your conversations.' },
]

export default function SettingsPage() {
  const [consents, setConsents] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)

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
  }, [])

  const generateApiKey = async () => {
    try {
      const res = await fetch('/api/user/apikey', { method: 'POST' })
      const data = await res.json()
      setApiKey(data.apiKey)
    } catch (err) {
      console.error(err)
    }
  }

  // ... (keeping toggleConsent, handleExport, handleDelete below)
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
    } catch (err) {
      console.error('Consent toggle error:', err)
    }
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
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Deletion failed')
      }
      window.location.href = '/login'
    } catch (err) {
      console.error('Delete error:', err)
      alert('Something went wrong deleting your account. Please try again, or contact support if this keeps happening.')
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary font-sans">

      <header className="border-b border-border bg-bg/80 backdrop-blur-md px-6 sm:px-10 h-[60px] flex items-center gap-4 sticky top-0 z-20">
        <Link href="/train" className="text-text-muted hover:text-text-primary transition-colors flex items-center gap-2 font-medium">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back
        </Link>
        <div className="w-px h-4 bg-border" />
        <span className="font-semibold text-text-primary tracking-wide">Settings</span>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">

        <div>
          <h1 className="text-3xl font-light tracking-tight text-text-primary">Settings</h1>
          <p className="text-text-muted mt-1">Data consent, API keys, export, and account management.</p>
        </div>

        {/* API Key */}
        <section className="ss-card p-6 space-y-4">
          <h2 className="text-sm font-medium text-text-faint uppercase tracking-widest">API Key (Jarvis Mode)</h2>
          <p className="text-sm text-text-muted">
            Use this API key to connect the Shadow Shelf VS Code extension to your account. Do not share this key with anyone.
          </p>
          <div className="flex items-center gap-4">
            <input 
              type="text" 
              readOnly 
              value={apiKey || 'Loading...'} 
              className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm font-mono text-text-primary"
            />
            {apiKey ? (
              <button onClick={() => navigator.clipboard.writeText(apiKey)} className="btnGhost px-4 py-3 rounded-xl whitespace-nowrap">
                Copy
              </button>
            ) : null}
          </div>
          <button onClick={generateApiKey} className="text-sm text-accent hover:text-accent-hover font-medium">
            {apiKey ? 'Regenerate API Key' : 'Generate API Key'}
          </button>
        </section>

        {/* Consent Toggles */}
        <section className="ss-card p-6 space-y-1">
          <h2 className="text-sm font-medium text-text-faint uppercase tracking-widest mb-4">Data Consent</h2>
          {loading ? (
            <p className="text-text-faint text-sm animate-pulse">Loading consent preferences...</p>
          ) : (
            STREAMS.map((s, i) => (
              <div key={s.key}>
                <div className="flex items-center justify-between py-4">
                  <div className="flex-1 pr-6">
                    <p className="text-text-primary text-sm font-medium">{s.label}</p>
                    <p className="text-text-faint text-xs mt-0.5">{s.description}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={consents[s.key] || false}
                    aria-label={`Toggle consent for ${s.label}`}
                    onClick={() => toggleConsent(s.key)}
                    disabled={saving === s.key}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                      consents[s.key] ? 'bg-accent' : 'bg-border'
                    }`}
                    style={{ opacity: saving === s.key ? 0.5 : 1 }}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                      style={{ transform: consents[s.key] ? 'translateX(20px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>
                {i < STREAMS.length - 1 && <div className="border-b border-border/60" />}
              </div>
            ))
          )}
        </section>

        {/* Account Data */}
        <section className="ss-card p-6 space-y-6">
          <h2 className="text-sm font-medium text-text-faint uppercase tracking-widest">Your Data</h2>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex-1 px-5 py-3 rounded-xl text-sm font-medium transition-all
                bg-surface hover:bg-card border border-border text-text-primary
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? 'Exporting...' : '↓ Export All My Data'}
            </button>
          </div>
          <p className="text-xs text-text-faint">
            Downloads a complete JSON file containing all your messages, memories, personality profiles, feedback, and consent history.
          </p>
          <Link
            href="/data-asset"
            className="flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium transition-all
              bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent-light hover:text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            View Your Data Asset Dashboard →
          </Link>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-950/20 border border-red-900/30 rounded-[20px] p-6 space-y-4">
          <h2 className="text-sm font-medium text-red-400/80 uppercase tracking-widest">Danger Zone</h2>
          <p className="text-sm text-text-muted">
            Permanently delete your account and all associated data. This includes messages, memories, personality profiles, feedback, and consent history. <strong className="text-red-300">This action cannot be undone.</strong>
          </p>

          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="px-5 py-3 rounded-xl text-sm font-medium transition-all
                bg-red-950/50 hover:bg-red-900/50 border border-red-800/40 text-red-300 hover:text-red-200"
            >
              Delete My Account
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-3 rounded-xl text-sm font-medium transition-all
                  bg-red-600 hover:bg-red-500 text-white
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Yes, Permanently Delete Everything'}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-5 py-3 rounded-xl text-sm font-medium
                  bg-surface text-text-muted hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}