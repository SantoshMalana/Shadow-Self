import { NextResponse } from 'next/server'
import { recordFeedback } from '@/lib/scout/audit'
import { advanceTierIfEarned } from '@/lib/scout/affordance'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { auditLogId, feedback, userId, signalType } = body

    // 1. Record feedback in the audit log
    await recordFeedback(auditLogId, feedback)

    // 2. If it was helpful, see if this signal type has earned a tier advancement
    if (feedback === 'helpful' && userId && signalType) {
      await advanceTierIfEarned(userId, signalType)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 })
  }
}
