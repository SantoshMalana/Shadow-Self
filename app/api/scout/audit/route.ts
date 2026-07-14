import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    // This would be secured behind an admin/founder auth check in production
    
    // Aggregate stage-by-stage funnel drop-off
    const logs = await db.pipelineAuditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 1000 // Sample size for recent dashboard
    })

    const funnel = {
      totalPings: logs.length,
      stage2Anomalies: logs.filter((l: any) => l.stage2AnomalyScore && l.stage2AnomalyScore > 2.0).length,
      stage3BoundariesReached: logs.filter((l: any) => l.stage3BoundaryReached).length,
      stage5ShowVerdicts: logs.filter((l: any) => l.stage5Verdict === 'SHOW').length,
      tier1or2Shown: logs.filter((l: any) => l.finalOutcome === 'shown_tier1' || l.finalOutcome === 'shown_tier2').length,
    }

    return NextResponse.json({ funnel, recentLogs: logs.slice(0, 50) })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve audit logs' }, { status: 500 })
  }
}
