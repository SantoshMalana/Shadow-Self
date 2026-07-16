import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/Sidebar'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch basic user stats
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, depthRung: true }
  })

  const name = dbUser?.name || 'User'

  return (
    <div className="h-screen bg-bg font-sans relative overflow-hidden text-text-primary flex">
      
      <Sidebar />

      {/* Main Area (Light) */}
      <main className="flex-1 relative flex flex-col items-center pt-24 pb-32 overflow-y-auto">
        
        {/* Soft Radial Gradient Background */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--color-accent-purple)]/20 rounded-full blur-[100px] opacity-60" />
        </div>

        {/* Top Header */}
        <header className="absolute top-0 left-0 right-0 h-[60px] flex items-center justify-between px-6 z-20 pointer-events-auto">
           <div className="flex items-center gap-2 lg:hidden">
              <span className="w-6 h-6 rounded-full flex items-center justify-center bg-black text-white font-bold">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              </span>
              <span className="font-bold tracking-tight text-xl">Shadow Shelf</span>
           </div>
           <div className="hidden lg:block font-bold text-xl text-[var(--color-accent-text)]">
              Dashboard
           </div>

        </header>

        <div className="z-10 text-center w-full max-w-5xl px-6 flex flex-col items-center pt-8">
          
          <div className="mb-6 flex justify-center animate-fade-in-up">
            <span className="w-12 h-12 rounded-full flex items-center justify-center bg-black text-white font-bold shadow-[var(--shadow-card)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            </span>
          </div>

          <h1 className="text-[40px] md:text-[48px] font-semibold tracking-tight mb-5 text-text-primary animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            How can we <span className="text-[var(--color-accent-purple)]">assist</span> you today, {name}?
          </h1>
          <p className="text-base text-text-muted mb-16 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            Get expert guidance powered by cognitive AI agents specializing in deep introspection, 
            technical pairing, and personal emulation. Choose the module that suits your needs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
            
            <Link href="/jarvis" className="stagger-1 group bg-white border border-border rounded-[20px] p-6 text-left hover:shadow-[var(--shadow-card)] transition-all flex flex-col h-full hover:-translate-y-1">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-semibold text-lg text-text-primary leading-tight">Jarvis Mode</h3>
                <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-muted group-hover:bg-[var(--color-surface)] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                </div>
              </div>
              <p className="text-sm text-text-muted mt-auto">Technical pair-programming & heuristic extraction.</p>
            </Link>

            <Link href="/train" className="stagger-2 group bg-white border border-border rounded-[20px] p-6 text-left hover:shadow-[var(--shadow-card)] transition-all flex flex-col h-full hover:-translate-y-1">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-semibold text-lg text-text-primary leading-tight">The<br/>Interviewer</h3>
                <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-muted group-hover:bg-[var(--color-surface)] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                </div>
              </div>
              <p className="text-sm text-text-muted mt-auto">Daily deep questions to refine your cognitive clone.</p>
            </Link>

            <Link href="/clone" className="stagger-3 group bg-white border border-border rounded-[20px] p-6 text-left hover:shadow-[var(--shadow-card)] transition-all flex flex-col h-full hover:-translate-y-1">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-semibold text-lg text-text-primary leading-tight">The Replica</h3>
                <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-muted group-hover:bg-[var(--color-surface)] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                </div>
              </div>
              <p className="text-sm text-text-muted mt-auto">Talk directly to your synthesized cognitive clone.</p>
            </Link>

            <Link href="/vscode-auth" className="stagger-4 group bg-white border border-border rounded-[20px] p-6 text-left hover:shadow-[var(--shadow-card)] transition-all flex flex-col h-full hover:-translate-y-1">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-semibold text-lg text-text-primary leading-tight">Connect<br/>Scout</h3>
                <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-muted group-hover:bg-[var(--color-surface)] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                </div>
              </div>
              <p className="text-sm text-text-muted mt-auto">Link your local editor to track intuition passively.</p>
            </Link>

          </div>
        </div>

        {/* Floating Input Area (Decorative Link to Jarvis) */}
        <div className="absolute bottom-8 left-0 right-0 z-30 flex justify-center px-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Link href="/jarvis" className="w-full max-w-3xl bg-white/90 backdrop-blur-xl border border-border/60 shadow-[var(--shadow-input)] rounded-[32px] p-2 pl-6 flex items-center group cursor-text transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:border-border">
            <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-text-muted mr-3 transition-colors group-hover:bg-white group-hover:shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </div>
            <span className="flex-1 text-text-faint text-[15px] select-none">type your prompt here to jump into Jarvis...</span>
            <div className="flex items-center gap-2 pr-1 h-[40px] shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-text-faint">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
              </div>
              <div className="w-10 h-10 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-[var(--color-accent-text)] group-hover:opacity-90">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </Link>
        </div>

      </main>
    </div>
  )
}
