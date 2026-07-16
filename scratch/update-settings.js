const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../app/settings/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// We'll replace the JSX structure from the return statement
const returnIndex = content.indexOf('  return (\n');
if (returnIndex !== -1) {
  const newRender = `  return (
    <div className="min-h-screen bg-bg text-text-primary font-sans flex flex-col items-center">

      <header className="w-full h-[60px] border-b border-border bg-white/80 backdrop-blur-md px-6 sm:px-10 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/home" className="text-text-muted hover:text-text-primary transition-colors flex items-center gap-2 font-medium">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back to Hub
          </Link>
          <div className="w-px h-4 bg-border" />
          <span className="font-bold text-[var(--color-accent-text)] text-lg tracking-tight">Shadow Shelf Settings</span>
        </div>
        <div className="flex items-center gap-3">
          {/* We don't have a save action since everything autosaves, but we put a decorative button or export button here */}
          <button onClick={handleExport} disabled={exporting} className="btnPrimary hidden sm:inline-flex">
            {exporting ? 'Exporting...' : 'Export Data'}
          </button>
        </div>
      </header>

      <div className="w-full max-w-5xl px-6 py-10">
        
        {/* Status Card equivalent to "Gmail action required" */}
        <div className="mb-8 w-full bg-white border border-border shadow-[var(--shadow-card)] rounded-[20px] p-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-text-primary">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
             </div>
             <div>
               <h3 className="font-semibold text-text-primary">Account Security</h3>
               <p className="text-sm text-text-muted">Manage your API keys and data access.</p>
             </div>
           </div>
           <div className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
             Protected
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: API Keys */}
          <div className="flex flex-col gap-6">
            <section className="bg-white border border-border shadow-[var(--shadow-card)] rounded-[20px] p-6 space-y-4 h-full">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                API Key (Jarvis Mode)
              </h2>
              <p className="text-sm text-text-muted">
                Use this API key to connect the Shadow Shelf VS Code extension. Do not share this key.
              </p>
              <div className="flex flex-col gap-3">
                <input 
                  type="text" 
                  readOnly 
                  value={apiKey || 'Loading...'} 
                  className="w-full bg-[var(--color-surface)] border border-border rounded-xl px-3 py-2.5 text-sm font-mono text-text-primary focus:outline-none"
                />
                <div className="flex gap-2">
                  {apiKey && (
                    <button onClick={() => navigator.clipboard.writeText(apiKey)} className="btnSecondary flex-1 justify-center py-2 text-xs">
                      Copy Key
                    </button>
                  )}
                  <button onClick={generateApiKey} className="btnPrimary flex-1 justify-center py-2 text-xs">
                    {apiKey ? 'Regenerate' : 'Generate'}
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Column 2: Data Consent */}
          <div className="flex flex-col gap-6">
            <section className="bg-white border border-border shadow-[var(--shadow-card)] rounded-[20px] p-6 h-full">
              <h2 className="text-sm font-bold text-text-primary mb-6 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Data Consent
              </h2>
              {loading ? (
                <p className="text-text-faint text-sm animate-pulse">Loading preferences...</p>
              ) : (
                <div className="space-y-5">
                  {STREAMS.map((s) => (
                    <div key={s.key} className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-text-primary text-[13px] font-semibold">{s.label}</p>
                        <p className="text-text-muted text-[12px] leading-snug mt-0.5">{s.description}</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={consents[s.key] || false}
                        onClick={() => toggleConsent(s.key)}
                        disabled={saving === s.key}
                        className={\`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 \${
                          consents[s.key] ? 'bg-[var(--color-accent)]' : 'bg-border'
                        }\`}
                        style={{ opacity: saving === s.key ? 0.5 : 1 }}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
                          style={{ transform: consents[s.key] ? 'translateX(16px)' : 'translateX(0)' }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Column 3: Data Asset & Danger Zone */}
          <div className="flex flex-col gap-4">
            <section className="bg-white border border-border shadow-[var(--shadow-card)] rounded-[20px] p-6">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Your Data
              </h2>
              <p className="text-[13px] text-text-muted mb-4">
                Access your cognitive profile visualization dashboard.
              </p>
              <Link
                href="/data-asset"
                className="btnPrimary w-full justify-center !bg-purple-100 !text-purple-700 hover:!bg-purple-200 border-none shadow-none"
              >
                View Dashboard →
              </Link>
            </section>

            <section className="bg-red-50 border border-red-100 rounded-[20px] p-6 h-full flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-2">Danger Zone</h2>
                <p className="text-[12px] text-red-600/80 leading-snug mb-4">
                  Permanently delete your account and all cognitive data. This cannot be undone.
                </p>
              </div>

              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="w-full py-2.5 rounded-xl text-[13px] font-bold bg-white border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
                >
                  Delete Account
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full py-2.5 rounded-xl text-[13px] font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Confirm Deletion'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="w-full py-2.5 rounded-xl text-[13px] font-bold bg-white border border-border text-text-muted hover:text-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </section>
          </div>

        </div>
      </div>
    </div>
  )
}`;
  content = content.substring(0, returnIndex) + newRender;
  fs.writeFileSync(file, content, 'utf8');
  console.log("Updated app/settings/page.tsx");
} else {
  console.error("Could not find return statement");
}
