import { prisma } from '@/lib/prisma'

export const VALID_STREAMS = ['voice', 'text', 'memory', 'personality', 'scout', 'distillation']

/**
 * Gets the user's latest consent state for all valid streams.
 * Returns a record of { streamName: boolean }
 */
export async function getUserConsents(userId: string): Promise<Record<string, boolean>> {
  const consents: Record<string, boolean> = {}

  for (const stream of VALID_STREAMS) {
    const latest = await prisma.consentLedger.findFirst({
      where: { userId, stream },
      orderBy: { timestamp: 'desc' },
    })
    // Default to false (opt-in required) if no ledger entry exists
    consents[stream] = latest?.consented ?? false
  }

  return consents
}
