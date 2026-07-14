import { prisma as db } from '@/lib/prisma'

export async function generateSessionSummary(userId: string) {
  // Pull today's Tier 0 and Tier 1 affordances from the audit log
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const logs = await db.pipelineAuditLog.findMany({
    where: {
      userId,
      timestamp: {
        gte: today,
      },
      finalOutcome: {
        in: ['shown_tier0', 'shown_tier1', 'shown_tier2'], // We show all interventions in the passive summary
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
  })

  // Format into a human-readable passive summary
  if (logs.length === 0) {
    return "Today: Smooth sailing. No major friction zones detected."
  }

  // Count occurrences
  const summaryCounts: Record<string, number> = {}
  logs.forEach((log: any) => {
    summaryCounts[log.signalType] = (summaryCounts[log.signalType] || 0) + 1
  })

  const lines = Object.entries(summaryCounts).map(([type, count]) => {
    if (type === 'file_hop_rate') return `${count} file-hop clusters`
    if (type === 'error_class') return `${count} recurring terminal errors`
    if (type === 'idle_seconds') return `${count} deep-focus idle sessions`
    return `${count} ${type} spikes`
  })

  return `Today: ${lines.join(', ')}.`
}
