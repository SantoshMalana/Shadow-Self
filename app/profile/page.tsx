import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getDbUser } from '@/lib/auth'
import { getPersonality, getCloneCompleteness } from '@/lib/personality'
import { getMemoryStats } from '@/lib/memory'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const user = await getDbUser()
  if (!user) {
    redirect('/login')
  }

  const personality = await getPersonality(user.id)
  const stats = await getMemoryStats(user.id)
  const completeness = getCloneCompleteness(personality)

  const tv = (t: any): string => (typeof t === 'string' ? t : t?.value || '')

  return (
    <div className="min-h-screen bg-bg text-text-primary font-sans selection:bg-accent/30">

      {/* Nav header — previously missing entirely, this page was a dead end */}
      <header className="border-b border-border bg-white/80 backdrop-blur-md px-6 sm:px-10 h-[60px] flex items-center gap-4 sticky top-0 z-20">
        <Link href="/train" className="text-text-muted hover:text-text-primary transition-colors flex items-center gap-2 font-medium">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back
        </Link>
        <div className="w-px h-4 bg-border" />
        <span className="font-semibold text-text-primary tracking-wide">Profile</span>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">
              {user.name ? `${user.name}'s Profile` : 'Cognitive Profile'}
            </h1>
            <p className="text-text-muted mt-1">Real-time analysis of your digital clone.</p>
          </div>

          <div className="flex gap-4">
            <div className="px-4 py-2 rounded-xl bg-[var(--color-accent-purple)]/10 border border-[var(--color-accent-purple)]/20 flex flex-col items-end">
              <span className="text-xs uppercase tracking-wider text-[var(--color-accent-purple)] font-medium">Trust Depth</span>
              <span className="text-lg text-text-primary font-semibold">Rung {user.depthRung} / 5</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-surface border border-border flex flex-col items-end">
              <span className="text-xs uppercase tracking-wider text-text-faint font-medium">Memories</span>
              <span className="text-lg text-text-primary font-semibold">{stats.totalMemories}</span>
            </div>
          </div>
        </header>

        {/* Completeness Bar */}
        <section className="bg-white border border-border rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-6">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-sm font-medium text-text-faint uppercase tracking-widest">Clone Completeness</h2>
            <span className="text-2xl font-bold text-text-primary">{completeness}%</span>
          </div>
          <div className="w-full bg-surface rounded-full h-3 overflow-hidden border border-border">
            <div
              className="h-3 transition-all duration-1000 ease-out"
              style={{ width: `${completeness}%`, background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-hover))' }}
            />
          </div>
        </section>

        {/* Traits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Communication Style */}
          <section className="bg-white border border-border rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-6 flex flex-col gap-4">
            <h3 className="text-text-primary font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Communication Style
            </h3>

            <div>
              <span className="text-xs text-text-faint uppercase tracking-wider mb-2 block">Tone</span>
              <div className="flex flex-wrap gap-2">
                {personality.communicationStyle.tone.length > 0 ? personality.communicationStyle.tone.map((t: any, i: number) => {
                  const val = tv(t);
                  return <span key={i} className="px-2.5 py-1 text-sm bg-blue-50 text-blue-700 rounded-md border border-blue-200">{val}</span>
                }) : <span className="text-sm text-text-faint italic">Gathering data...</span>}
              </div>
            </div>

            <div>
              <span className="text-xs text-text-faint uppercase tracking-wider mb-2 block">Vocabulary</span>
              <div className="flex flex-wrap gap-2">
                {personality.communicationStyle.vocabulary.length > 0 ? personality.communicationStyle.vocabulary.map((v: any, i: number) => {
                  const val = tv(v);
                  return <span key={i} className="px-2.5 py-1 text-sm bg-surface text-text-muted rounded-md border border-border">{val}</span>
                }) : <span className="text-sm text-text-faint italic">Gathering data...</span>}
              </div>
            </div>

            {personality.communicationStyle.explanationStyle && (
              <div>
                <span className="text-xs text-text-faint uppercase tracking-wider mb-1 block">Explanation Style</span>
                <p className="text-sm text-text-muted">{personality.communicationStyle.explanationStyle}</p>
              </div>
            )}
          </section>

          {/* Thinking Patterns */}
          <section className="bg-white border border-border rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-6 flex flex-col gap-4">
            <h3 className="text-text-primary font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-accent-purple)]" />
              Thinking Patterns
            </h3>

            <div>
              <span className="text-xs text-text-faint uppercase tracking-wider mb-2 block">Core Values</span>
              <div className="flex flex-wrap gap-2">
                {personality.thinkingPatterns.values.length > 0 ? personality.thinkingPatterns.values.map((v: any, i: number) => {
                  const val = tv(v);
                  return <span key={i} className="px-2.5 py-1 text-sm bg-[var(--color-accent-purple)]/10 text-[var(--color-accent-purple)] rounded-md border border-[var(--color-accent-purple)]/20">{val}</span>
                }) : <span className="text-sm text-text-faint italic">Gathering data...</span>}
              </div>
            </div>

            <div>
              <span className="text-xs text-text-faint uppercase tracking-wider mb-2 block">Extracted Opinions</span>
              <ul className="space-y-2">
                {personality.thinkingPatterns.opinions.length > 0 ? personality.thinkingPatterns.opinions.map((o: any, i: number) => {
                  const val = tv(o);
                  return <li key={i} className="text-sm text-text-muted pl-3 border-l-2 border-[var(--color-accent-purple)]/30">{val}</li>
                }) : <span className="text-sm text-text-faint italic">Gathering data...</span>}
              </ul>
            </div>
          </section>

          {/* Emotional & Knowledge */}
          <section className="flex flex-col gap-6">
            <div className="bg-white border border-border rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-6">
              <h3 className="text-text-primary font-semibold flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Emotional Profile
              </h3>
              <span className="text-xs text-text-faint uppercase tracking-wider mb-2 block">Passion Topics</span>
              <div className="flex flex-wrap gap-2 mb-4">
                {personality.emotionalProfile.passionTopics.length > 0 ? personality.emotionalProfile.passionTopics.map((p: any, i: number) => {
                  const val = tv(p);
                  return <span key={i} className="px-2.5 py-1 text-sm bg-rose-50 text-rose-700 rounded-md border border-rose-200">{val}</span>
                }) : <span className="text-sm text-text-faint italic">Gathering data...</span>}
              </div>

              {personality.emotionalProfile.humorStyle && (
                <>
                  <span className="text-xs text-text-faint uppercase tracking-wider mb-1 block">Humor Style</span>
                  <p className="text-sm text-text-muted">{personality.emotionalProfile.humorStyle}</p>
                </>
              )}
            </div>

            <div className="bg-white border border-border rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-6 flex-grow">
              <h3 className="text-text-primary font-semibold flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Knowledge Domains
              </h3>
              <div className="flex flex-wrap gap-2">
                {personality.knowledgeDomains.length > 0 ? personality.knowledgeDomains.map((d: any, i: number) => {
                  const val = tv(d);
                  return <span key={i} className="px-2.5 py-1 text-sm bg-surface text-text-muted rounded-md border border-border">{val}</span>
                }) : <span className="text-sm text-text-faint italic">Gathering data...</span>}
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}