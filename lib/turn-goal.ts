import { prisma } from './prisma'

export type TurnGoal = 'engage_only' | 'check_in' | 'hold_depth' | 'explore_gap' | 'general'

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

  // Rough proxy for "depth rung changed recently" — see the note in
  // lib/depth-rung.ts about adding a dedicated timestamp for precision.
  if (recentlyUpdated(user.updatedAt, 72) && messageCount < 15) {
    return 'hold_depth'
  }

  return 'explore_gap'
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000)
}

function recentlyUpdated(date: Date, hours: number): boolean {
  return Date.now() - date.getTime() < hours * 60 * 60 * 1000
}
