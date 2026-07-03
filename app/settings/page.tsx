'use client'

import { useEffect, useState } from 'react'

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
  }, [])

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
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `shadow-shelf-export-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
    }
    setExporting(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await fetch('/api/account/delete', { method: 'DELETE' })
      window.location.href = '/login'
    } catch (err) {
      console.error('Delete error:', err)
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-10">
        
        <header>
          <h1 className="text-3xl font-light tracking-tight text-white">Settings</h1>
          <p className="text-neutral-500 mt-1">Data consent, export, and account management.</p>
        </header>

        {/* Consent Toggles */}
        <section className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 space-y-1">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-widest mb-4">Data Consent</h2>
          {loading ? (
            <p className="text-neutral-600 text-sm">Loading consent preferences...</p>
          ) : (
            STREAMS.map((s, i) => (
              <div key={s.key}>
                <div className="flex items-center justify-between py-4">
                  <div className="flex-1 pr-6">
                    <p className="text-white text-sm font-medium">{s.label}</p>
                    <p className="text-neutral-500 text-xs mt-0.5">{s.description}</p>
                  </div>
                  <button
                    onClick={() => toggleConsent(s.key)}
                    disabled={saving === s.key}
                    className="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
                    style={{
                      background: consents[s.key] ? '#6366f1' : '#333',
                      opacity: saving === s.key ? 0.5 : 1,
                    }}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                      style={{ transform: consents[s.key] ? 'translateX(20px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>
                {i < STREAMS.length - 1 && <div className="border-b border-neutral-800/50" />}
              </div>
            ))
          )}
        </section>

        {/* Account Data */}
        <section className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-widest">Your Data</h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex-1 px-5 py-3 rounded-xl text-sm font-medium transition-all
                bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? 'Exporting...' : '↓ Export All My Data'}
            </button>
          </div>
          <p className="text-xs text-neutral-600">
            Downloads a complete JSON file containing all your messages, memories, personality profiles, feedback, and consent history.
          </p>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-950/20 border border-red-900/30 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-medium text-red-400/80 uppercase tracking-widest">Danger Zone</h2>
          <p className="text-sm text-neutral-400">
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
                  bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
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
