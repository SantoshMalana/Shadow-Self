import { prisma as db } from '@/lib/prisma'

export interface AuditLogEntry {
  userId: string
  signalType: string
  stage1Raw: any
  stage2AnomalyScore?: number
  stage3BoundaryReached?: string
  stage4StuckConfidence?: number
  stage4ContentConfidence?: number
  stage5Verdict?: 'SHOW' | 'HOLD' | 'DISCARD'
  finalOutcome: 'shown_tier0' | 'shown_tier1' | 'shown_tier2' | 'suppressed' | 'queued' | 'decayed'
  userFeedback?: 'helpful' | 'dismissed' | 'no_response'
}

export async function logPipelineAudit(entry: AuditLogEntry) {
  await db.pipelineAuditLog.create({
    data: {
      userId: entry.userId,
      signalType: entry.signalType,
      stage1Raw: entry.stage1Raw,
      stage2AnomalyScore: entry.stage2AnomalyScore ?? null,
      stage3BoundaryReached: entry.stage3BoundaryReached ?? null,
      stage4StuckConfidence: entry.stage4StuckConfidence ?? null,
      stage4ContentConfidence: entry.stage4ContentConfidence ?? null,
      stage5Verdict: entry.stage5Verdict ?? null,
      finalOutcome: entry.finalOutcome,
      userFeedback: entry.userFeedback ?? null,
    },
  })
}

export async function recordFeedback(auditLogId: string, feedback: 'helpful' | 'dismissed' | 'no_response') {
  await db.pipelineAuditLog.update({
    where: { id: auditLogId },
    data: { userFeedback: feedback }
  })
}
