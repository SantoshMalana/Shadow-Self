import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDbUser } from '@/lib/auth'
import { getPersonality } from '@/lib/personality'

/**
 * GET /api/data-asset — returns the user's full cognitive data asset:
 * personality profile (with provenance), journeys, and consent history.
 */
export async function GET() {
  try {
    const user = await getDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch personality, consent history, and recent messages in parallel
    const [personality, consentHistory, recentMessages] = await Promise.all([
      getPersonality(user.id),
      prisma.consentLedger.findMany({
        where: { userId: user.id },
        orderBy: { timestamp: 'desc' },
        take: 100,
      }),
      prisma.message.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: { id: true, content: true, role: true, mode: true, createdAt: true },
      }),
    ])

    // Build a lookup map for messages so the frontend can resolve sourceIds
    const messageMap: Record<string, { content: string; role: string; createdAt: string }> = {}
    for (const msg of recentMessages) {
      messageMap[msg.id] = {
        content: msg.content.slice(0, 200), // Truncate for preview
        role: msg.role,
        createdAt: msg.createdAt.toISOString(),
      }
    }

    // Extract journeys from personality
    const journeys = (personality.thinkingPatterns?.decisionFramework || [])
      .filter((d: any) => typeof d === 'object' && d.situation)

    // Extract provenanced traits for display
    const extractProvenanced = (arr: any[]) =>
      (arr || [])
        .filter((t: any) => typeof t === 'object' && t.value && t.sourceId)
        .map((t: any) => ({
          value: t.value,
          sourceId: t.sourceId,
          timestamp: t.timestamp,
          sourcePreview: messageMap[t.sourceId]?.content || null,
        }))

    const provenanceChain = {
      tones: extractProvenanced(personality.communicationStyle?.tone || []),
      values: extractProvenanced(personality.thinkingPatterns?.values || []),
      opinions: extractProvenanced(personality.thinkingPatterns?.opinions || []),
      vocabulary: extractProvenanced(personality.communicationStyle?.vocabulary || []),
      passionTopics: extractProvenanced(personality.emotionalProfile?.passionTopics || []),
      knowledgeDomains: extractProvenanced(personality.knowledgeDomains || []),
    }

    // Format consent history
    const consents = consentHistory.map(c => ({
      stream: c.stream,
      consented: c.consented,
      timestamp: c.timestamp.toISOString(),
      ipAddress: c.ipAddress ? `${c.ipAddress.slice(0, 6)}...` : null, // Partial for privacy
    }))

    return NextResponse.json({
      personality: {
        sessions: personality.sessions,
        version: personality.version,
        completeness: getCompleteness(personality),
      },
      journeys,
      provenanceChain,
      consents,
    })
  } catch (error: any) {
    console.error('Data asset GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getCompleteness(p: any): number {
  let score = 0
  score += Math.min((p.communicationStyle?.tone?.length || 0) * 5, 20)
  score += Math.min((p.communicationStyle?.vocabulary?.length || 0) * 1, 15)
  score += Math.min((p.thinkingPatterns?.values?.length || 0) * 3, 20)
  score += Math.min((p.thinkingPatterns?.opinions?.length || 0) * 1, 15)
  score += Math.min((p.emotionalProfile?.passionTopics?.length || 0) * 3, 15)
  score += Math.min((p.knowledgeDomains?.length || 0) * 3, 15)
  return Math.min(score, 100)
}
