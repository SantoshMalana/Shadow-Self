import Link from 'next/link'

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans relative overflow-hidden text-text-primary">
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
          <span className="font-semibold text-text-primary">Safety Protocol</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative z-10 px-6 py-12 bg-bg">
        <div className="max-w-3xl mx-auto prose prose-p:text-text-muted prose-headings:text-text-primary">
          <h1 className="text-3xl font-bold tracking-tight mb-8">Crisis & Safety Protocol</h1>
          <p className="text-sm text-text-faint mb-8">Effective: July 2026</p>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">You are not alone.</h2>
            <p className="mb-4 text-text-muted">
              If things feel unsafe right now, or if you are experiencing a mental health crisis, please reach out to people who are trained to support you. Shadow Shelf is an AI application and is <strong>not</strong> equipped to provide medical, psychological, or crisis counseling.
            </p>
            
            <div className="bg-surface border border-border rounded-lg p-6 my-6 shadow-sm">
              <h3 className="text-lg font-bold text-[var(--color-accent-purple)] mb-4">Immediate Resources (US)</h3>
              <ul className="space-y-4 text-text-muted">
                <li>
                  <strong>988 Suicide & Crisis Lifeline:</strong> Call or text <a href="tel:988" className="text-[var(--color-accent-purple)] hover:underline">988</a> (Available 24/7, English & Spanish)
                </li>
                <li>
                  <strong>Crisis Text Line:</strong> Text <code>HOME</code> to <strong>741741</strong>
                </li>
                <li>
                  <strong>The Trevor Project</strong> (LGBTQ youth): Call <a href="tel:1-866-488-7386" className="text-[var(--color-accent-purple)] hover:underline">866-488-7386</a> or text <code>START</code> to <strong>678-678</strong>
                </li>
                <li>
                  <strong>Veterans Crisis Line:</strong> Dial 988, then press 1
                </li>
              </ul>
            </div>

            <div className="bg-surface border border-border rounded-lg p-6 my-6 shadow-sm">
              <h3 className="text-lg font-bold text-[var(--color-accent-purple)] mb-4">International Resources</h3>
              <p className="text-text-muted">
                If you are outside the United States, please visit the <a href="https://www.iasp.info/resources/Crisis_Centres/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent-purple)] hover:underline">International Association for Suicide Prevention (IASP) directory</a> to find a crisis center in your country.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">How Our System Responds to Crisis Language</h2>
            <p className="mb-4 text-text-muted">
              Shadow Shelf complies with best practices and legal requirements (such as California SB 243 and New York S-3008C) regarding AI companion safety. We maintain a zero-latency keyword classifier designed to detect common phrases associated with severe emotional distress or self-harm.
            </p>
            <p className="mb-4 text-text-muted">
              When crisis language is detected in a conversation:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-text-muted">
              <li>
                <strong>We append a safety notice:</strong> The AI will continue the conversation naturally, but a standardized crisis resource message will be appended to the bottom of the response.
              </li>
              <li>
                <strong>We log an audit event:</strong> The system logs the timestamp and a maximum 50-character snippet of the triggering message. This is used solely for safety auditing and compliance verification. It is kept entirely separate from your standard chat logs.
              </li>
              <li>
                <strong>We do NOT alert emergency services:</strong> Shadow Shelf does not actively monitor live conversations with human reviewers, nor do we contact local authorities or emergency responders.
              </li>
            </ul>
          </section>

        </div>
      </main>
    </div>
  )
}
