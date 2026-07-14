import { prisma as db } from '@/lib/prisma'
import { SignalType } from './types'

export type AffordanceTier = 0 | 1 | 2 // 0: Silent, 1: Gutter Icon, 2: Voice/Proactive

export async function determineAffordanceTier(userId: string, signalType: SignalType): Promise<AffordanceTier> {
  const ledger = await db.scoutTrustLedger.findUnique({
    where: {
      userId_signalType: {
        userId,
        signalType,
      },
    },
  })

  if (!ledger) {
    return 0 // Default to silent / shadow mode
  }

  // Double check constraints - a tier 2 shouldn't happen unless proven
  // Real implementation would calculate acceptance rates here to verify
  // safety before returning the stored tier.
  
  return (ledger.tier as AffordanceTier) || 0
}

export async function advanceTierIfEarned(userId: string, signalType: SignalType) {
  // Logic from spec 3.4:
  // A signal type does not leave Tier 0 until N shadow-mode observations.
  // A signal type does not reach Tier 2 until real acceptance history at Tier 1.
  
  // Implementation stub for tracking and advancing ledger
  // This would be called by the feedback processing route
}
