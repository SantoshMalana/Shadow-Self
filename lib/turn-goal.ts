import { prisma } from './prisma'
import { recallMemories } from './memory'

export type TurnGoal = 'engage_only' | 'check_in' | 'hold_depth' | 'explore_gap' | 'switch_topic' | 'connect_dots' | 'challenge_assumption' | 'curiosity_gap' | 'general'

export async function determineTurnGoal(userId: string): Promise<TurnGoal> {
  const messageCount = await prisma.message.count({ where: { userId, role: 'user' } })

  // No prior real exchange at all — pure Engage, no exceptions.
  if (messageCount === 0) return 'engage_only'

  // A recent thumbs-down means something's unresolved — check in before
  // introducing anything new.
  const recentDownvote = await prisma.feedback.findFirst({
    where: { userId, rating: 'down', createdAt: { gte: daysAgo(2) } },
    orderBy: { createdAt: 'desc' },
  })
  if (recentDownvote) return 'check_in'

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return 'general'

  // Rough proxy for "depth rung changed recently"
  if (recentlyUpdated(user.updatedAt, 72) && messageCount < 15) {
    return 'hold_depth'
  }

  // Get last few messages for analysis
  const recentMessages = await prisma.message.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 6,
    select: { content: true, role: true },
  })

  const lastUserMsg = recentMessages.find(m => m.role === 'user')
  const assistantMsgs = recentMessages.filter(m => m.role === 'assistant')

  // ── CONNECT DOTS: If the user's last message topic has strong recall
  // matches from older memories, trigger synthesis across past + present.
  if (lastUserMsg && messageCount > 8) {
    try {
      const memories = await recallMemories(userId, lastUserMsg.content, 3)
      // If we found memories AND they're not from this exact conversation
      // (heuristic: memory text doesn't exactly match recent messages)
      if (memories.length >= 2) {
        const recentTexts = recentMessages.map(m => m.content.toLowerCase())
        const novelMemories = memories.filter(
          mem => !recentTexts.some(t => t.includes(mem.slice(0, 40).toLowerCase()))
        )
        if (novelMemories.length >= 1) {
          return 'connect_dots'
        }
      }
    } catch { /* memory recall failure should not block goal selection */ }
  }

  // ── CHALLENGE ASSUMPTION: If the user just made a strong opinion statement
  // (contains definitive language), occasionally push back.
  if (lastUserMsg && messageCount > 12 && user.depthRung >= 3) {
    const lower = lastUserMsg.content.toLowerCase()
    const strongOpinionMarkers = [
      'should always', 'should never', 'the best way', 'the only way',
      'i believe', 'i think everyone', 'most people are wrong',
      'you have to', 'that\'s just how', 'obviously', 'clearly',
      'the truth is', 'no one should', 'everyone needs to',
    ]
    const hasStrongOpinion = strongOpinionMarkers.some(m => lower.includes(m))
    if (hasStrongOpinion) {
      // Only challenge ~30% of the time to not be annoying
      if (Math.random() < 0.3) {
        return 'challenge_assumption'
      }
    }
  }

  // ── CURIOSITY GAP: If the last user message was long and thoughtful
  // (> 100 chars, not a question), create a meta-level curiosity gap
  if (lastUserMsg && messageCount > 6) {
    const isLong = lastUserMsg.content.length > 100
    const isNotQuestion = !lastUserMsg.content.trim().endsWith('?')
    if (isLong && isNotQuestion && Math.random() < 0.25) {
      return 'curiosity_gap'
    }
  }

  // ── SWITCH TOPIC: Use a smarter heuristic than just "are they all questions?"
  // Check if the last 4 assistant messages share significant vocabulary overlap
  if (assistantMsgs.length >= 4) {
    const contents = assistantMsgs.slice(0, 4).map(m => m.content.toLowerCase())
    
    // Extract significant words (> 4 chars) from each message
    const wordSets = contents.map(c => 
      new Set(c.split(/\W+/).filter(w => w.length > 4))
    )
    
    // Count words that appear in 3+ of the 4 messages
    const allWords = new Set(wordSets.flatMap(s => [...s]))
    let sharedCount = 0
    for (const word of allWords) {
      const appearances = wordSets.filter(s => s.has(word)).length
      if (appearances >= 3) sharedCount++
    }
    
    // If more than 3 significant words are shared across 3+ messages,
    // we're likely stuck on the same topic
    if (sharedCount > 3) {
      return 'switch_topic'
    }
  }

  return 'explore_gap'
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000)
}

function recentlyUpdated(date: Date, hours: number): boolean {
  return Date.now() - date.getTime() < hours * 60 * 60 * 1000
}
