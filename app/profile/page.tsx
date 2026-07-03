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

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-6 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-white">
              {user.name ? `${user.name}'s Profile` : 'Cognitive Profile'}
            </h1>
            <p className="text-neutral-400 mt-1">Real-time analysis of your digital clone.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-end">
              <span className="text-xs uppercase tracking-wider text-indigo-400 font-medium">Trust Depth</span>
              <span className="text-lg text-indigo-100 font-semibold">Rung {user.depthRung} / 5</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-end">
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-medium">Memories</span>
              <span className="text-lg text-emerald-100 font-semibold">{stats.totalMemories}</span>
            </div>
          </div>
        </header>

        {/* Completeness Bar */}
        <section className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-widest">Clone Completeness</h2>
            <span className="text-2xl font-light text-white">{completeness}%</span>
          </div>
          <div className="w-full bg-neutral-950 rounded-full h-3 overflow-hidden border border-neutral-800/50">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 transition-all duration-1000 ease-out" 
              style={{ width: `${completeness}%` }}
            />
          </div>
        </section>

        {/* Traits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Communication Style */}
          <section className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-white font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Communication Style
            </h3>
            
            <div>
              <span className="text-xs text-neutral-500 uppercase tracking-wider mb-2 block">Tone</span>
              <div className="flex flex-wrap gap-2">
                {personality.communicationStyle.tone.length > 0 ? personality.communicationStyle.tone.map(t => (
                  <span key={t} className="px-2.5 py-1 text-sm bg-neutral-800 text-blue-200 rounded-md border border-neutral-700">{t}</span>
                )) : <span className="text-sm text-neutral-600 italic">Gathering data...</span>}
              </div>
            </div>

            <div>
              <span className="text-xs text-neutral-500 uppercase tracking-wider mb-2 block">Vocabulary</span>
              <div className="flex flex-wrap gap-2">
                {personality.communicationStyle.vocabulary.length > 0 ? personality.communicationStyle.vocabulary.map(v => (
                  <span key={v} className="px-2.5 py-1 text-sm bg-neutral-800 text-neutral-300 rounded-md border border-neutral-700">{v}</span>
                )) : <span className="text-sm text-neutral-600 italic">Gathering data...</span>}
              </div>
            </div>

            {personality.communicationStyle.explanationStyle && (
              <div>
                <span className="text-xs text-neutral-500 uppercase tracking-wider mb-1 block">Explanation Style</span>
                <p className="text-sm text-neutral-300">{personality.communicationStyle.explanationStyle}</p>
              </div>
            )}
          </section>

          {/* Thinking Patterns */}
          <section className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-white font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Thinking Patterns
            </h3>
            
            <div>
              <span className="text-xs text-neutral-500 uppercase tracking-wider mb-2 block">Core Values</span>
              <div className="flex flex-wrap gap-2">
                {personality.thinkingPatterns.values.length > 0 ? personality.thinkingPatterns.values.map(v => (
                  <span key={v} className="px-2.5 py-1 text-sm bg-purple-500/10 text-purple-300 rounded-md border border-purple-500/20">{v}</span>
                )) : <span className="text-sm text-neutral-600 italic">Gathering data...</span>}
              </div>
            </div>

            <div>
              <span className="text-xs text-neutral-500 uppercase tracking-wider mb-2 block">Extracted Opinions</span>
              <ul className="space-y-2">
                {personality.thinkingPatterns.opinions.length > 0 ? personality.thinkingPatterns.opinions.map((o, i) => (
                  <li key={i} className="text-sm text-neutral-300 pl-3 border-l-2 border-neutral-700">{o}</li>
                )) : <span className="text-sm text-neutral-600 italic">Gathering data...</span>}
              </ul>
            </div>
          </section>

          {/* Emotional & Knowledge */}
          <section className="flex flex-col gap-6">
            <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-6">
              <h3 className="text-white font-medium flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Emotional Profile
              </h3>
              <span className="text-xs text-neutral-500 uppercase tracking-wider mb-2 block">Passion Topics</span>
              <div className="flex flex-wrap gap-2 mb-4">
                {personality.emotionalProfile.passionTopics.length > 0 ? personality.emotionalProfile.passionTopics.map(p => (
                  <span key={p} className="px-2.5 py-1 text-sm bg-rose-500/10 text-rose-300 rounded-md border border-rose-500/20">{p}</span>
                )) : <span className="text-sm text-neutral-600 italic">Gathering data...</span>}
              </div>

              {personality.emotionalProfile.humorStyle && (
                <>
                  <span className="text-xs text-neutral-500 uppercase tracking-wider mb-1 block">Humor Style</span>
                  <p className="text-sm text-neutral-300">{personality.emotionalProfile.humorStyle}</p>
                </>
              )}
            </div>

            <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-6 flex-grow">
              <h3 className="text-white font-medium flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Knowledge Domains
              </h3>
              <div className="flex flex-wrap gap-2">
                {personality.knowledgeDomains.length > 0 ? personality.knowledgeDomains.map(d => (
                  <span key={d} className="px-2.5 py-1 text-sm bg-neutral-800 text-neutral-300 rounded-md border border-neutral-700">{d}</span>
                )) : <span className="text-sm text-neutral-600 italic">Gathering data...</span>}
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
