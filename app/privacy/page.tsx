import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans relative overflow-hidden text-text-primary">
      {/* Ambient background */}
      <div className={`lightFx opacity-40`} aria-hidden="true">
        <div className="raySource" />
        <div className="rays" />
      </div>

      <header className="border-b border-border bg-white/80 backdrop-blur-md z-20 relative px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-text-muted hover:text-text-primary transition-colors flex items-center gap-2 font-medium">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back Home
          </Link>
          <span className="font-semibold text-text-primary">Privacy Policy</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative z-10 px-6 py-12 bg-bg">
        <div className="max-w-3xl mx-auto prose prose-p:text-text-muted prose-headings:text-text-primary">
          <h1 className="text-3xl font-bold tracking-tight mb-8">Privacy Policy</h1>
          <p className="text-sm text-text-faint mb-8">Last updated: July 2026</p>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">The Zero Architecture Vision</h2>
            <p className="mb-4 text-text-muted">
              Shadow Shelf is built on the principle of absolute data sovereignty. We are capturing deeply personal intuition, problem-solving methodologies, and voice data to create a cognitive clone. This data belongs to you, not us.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">What We Collect</h2>
            <ul className="list-disc pl-6 space-y-2 text-text-muted">
              <li><strong>Conversational Data:</strong> The text of your chats during onboarding and training.</li>
              <li><strong>Voice Data:</strong> Audio snippets recorded during voice input (transcribed locally or via secure API, never permanently stored by us).</li>
              <li><strong>Extracted Traits:</strong> The synthesized personality profile (communication style, values, etc.) extracted from your conversations.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">How We Use It</h2>
            <p className="mb-4 text-text-muted">
              Your data is used strictly to train and operate your personal cognitive clone. We do not sell your data. We do not use your data to train generalized models for other users. The vector embeddings generated from your conversations are siloed to your account.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Data Deletion & Retention</h2>
            <p className="mb-4 text-text-muted">
              You have the right to purge your entire profile, all chat logs, and all personal vector embeddings at any time. A full account deletion will irrevocably wipe all associated personal data from our servers.
            </p>
            <div className="bg-surface border border-border rounded-lg p-6 my-6 shadow-sm">
              <h3 className="text-lg font-bold text-[var(--color-accent-purple)] mb-4">Zero-Knowledge Cognitive Distillation</h3>
              <p className="mb-4 text-sm text-text-muted">
                To improve the baseline intelligence of our systems, we run a "Zero-Knowledge Distillation" pipeline on technical troubleshooting sessions (like Jarvis Mode). This pipeline completely strips all Personally Identifiable Information (PII), proper nouns, code snippets, and specific technical references from your conversation.
              </p>
              <p className="mb-4 text-sm text-text-muted">
                It then extracts only the abstract, generalizable problem-solving heuristic (e.g., "When encountering race conditions, verify lock ordering before increasing timeouts").
              </p>
              <p className="font-semibold text-sm text-text-primary">
                Because these extracted heuristics contain absolutely no personal data and hold no cryptographic or database link to your account (no foreign keys), they cannot be traced back to you and <span className="text-[var(--color-accent-purple)]">will not be deleted</span> if you delete your account. They become part of the collective anonymous intelligence of the platform.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
