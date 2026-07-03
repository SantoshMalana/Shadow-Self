import { prisma } from './prisma'

const THRESHOLDS = [0, 8, 20, 40, 70] // user-messages needed to reach rung 2, 3, 4, 5

export async function maybeAdvanceDepthRung(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.depthRung >= 5) return

  const messageCount = await prisma.message.count({ where: { userId, role: 'user' } })
  const recentDownvotes = await prisma.feedback.count({
    where: { userId, rating: 'down', createdAt: { gte: daysAgo(7) } },
  })

  const nextRungThreshold = THRESHOLDS[user.depthRung]

  if (nextRungThreshold && messageCount >= nextRungThreshold && recentDownvotes === 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { depthRung: user.depthRung + 1 },
    })
  }
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000)
}
