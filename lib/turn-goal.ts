import { prisma } from './prisma'

export type TurnGoal = 'engage_only' | 'check_in' | 'hold_depth' | 'explore_gap' | 'switch_topic' | 'general'

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

  // Topic-breadth tracking: if the last 4+ assistant messages are all
  // probing the same general area, force a topic switch so the user
  // doesn't feel interrogated (Ayush feedback: "keeps making questions
  // on my answers instead of asking on a different topic").
  const recentMessages = await prisma.message.findMany({
    where: { userId, role: 'assistant' },
    orderBy: { createdAt: 'desc' },
    take: 4,
    select: { content: true },
  })

  if (recentMessages.length >= 4) {
    const contents = recentMessages.map(m => m.content.toLowerCase())
    // Simple heuristic: if last 4 messages share a repeated question
    // word pattern (what/how/why + same topic keywords), switch topic
    const questionPattern = /(?:what|how|why|when|tell me|can you|do you)\b/i
    const allQuestions = contents.every(c => questionPattern.test(c))
    if (allQuestions) {
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
