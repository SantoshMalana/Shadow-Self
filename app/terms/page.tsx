import Link from 'next/link'

export default function TermsPage() {
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
          <span className="font-semibold text-text-primary">Terms of Service</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative z-10 px-6 py-12 bg-bg">
        <div className="max-w-3xl mx-auto prose prose-p:text-text-muted prose-headings:text-text-primary">
          <h1 className="text-3xl font-bold tracking-tight mb-8">Terms of Service</h1>
          <p className="text-sm text-text-faint mb-8">Last updated: July 2026</p>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4 text-text-muted">
              By accessing and using Shadow Shelf ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4 text-text-muted">
              Shadow Shelf provides a platform for creating a cognitive clone through conversational interactions and voice inputs. The Service relies on third-party language models (e.g., via OpenRouter) to process your data and generate responses.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">3. User Responsibilities and Conduct</h2>
            <p className="mb-4 text-text-muted">
              You are responsible for the data you provide to the Service. You agree not to input classified, legally privileged, or highly sensitive financial information unless you explicitly accept the risks associated with third-party language model processing.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">4. Intellectual Property</h2>
            <p className="mb-4 text-text-muted">
              The underlying intellectual property of your cognitive clone—its unique synthesis of your traits, problem-solving methodologies, and communication style—belongs to you. We claim no ownership over your clone.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
