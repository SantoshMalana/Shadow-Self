import { prisma as db } from '@/lib/prisma'
import { QueuedFrictionEvent, SignalType, WorkflowBoundary, QUEUE_DECAY_MINUTES } from './types'

export async function queueFrictionEvent(userId: string, signalType: SignalType) {
  const expiresAt = new Date(Date.now() + QUEUE_DECAY_MINUTES * 60000)

  await db.queuedFrictionEvent.create({
    data: {
      userId,
      signalType,
      expiresAt,
    },
  })
}

export async function checkQueueAtBoundary(userId: string, boundary: WorkflowBoundary): Promise<QueuedFrictionEvent[]> {
  const now = new Date()

  // Find all unexpired events
  const queuedEvents = await db.queuedFrictionEvent.findMany({
    where: {
      userId,
      expiresAt: {
        gte: now,
      },
    },
  })

  // Delete expired events to clean up the queue
  await db.queuedFrictionEvent.deleteMany({
    where: {
      userId,
      expiresAt: {
        lt: now,
      },
    },
  })

  if (queuedEvents.length === 0) {
    return []
  }

  // Once processed at a boundary, we clear them so they aren't processed again at the next boundary
  await db.queuedFrictionEvent.deleteMany({
    where: {
      id: {
        in: queuedEvents.map((e: any) => e.id),
      },
    },
  })

  return queuedEvents.map(e => ({
    ...e,
    signalType: e.signalType as SignalType
  }))
}
