import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDbUser } from '@/lib/auth'

/**
 * GET /api/account/export
 * Returns a full JSON export of all user data (GDPR-compliant).
 */
export async function GET() {
  try {
    const user = await getDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch ALL user data across every table
    const [messages, personalities, feedbacks, consents] = await Promise.all([
      prisma.message.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
        select: { id: true, role: true, content: true, mode: true, turnGoal: true, createdAt: true }
      }),
      prisma.personalityProfile.findMany({
        where: { userId: user.id },
        orderBy: { version: 'desc' },
        select: {
          id: true, version: true, sessions: true, isActive: true, createdAt: true,
          communicationStyle: true, thinkingPatterns: true, emotionalProfile: true,
          knowledgeDomains: true, voiceId: true
        }
      }),
      prisma.feedback.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
        select: { id: true, messageId: true, rating: true, correctionText: true, createdAt: true }
      }),
      prisma.consentLedger.findMany({
        where: { userId: user.id },
        orderBy: { timestamp: 'asc' },
        select: { id: true, stream: true, consented: true, timestamp: true }
      }),
    ])

    // Memory content (no embeddings — they're not human-readable)
    const memories = await prisma.memory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, content: true, category: true, createdAt: true }
    })

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        depthRung: user.depthRung,
        daysKnown: user.daysKnown,
        createdAt: user.createdAt,
      },
      messages,
      memories,
      personalityProfiles: personalities,
      feedback: feedbacks,
      consentLedger: consents,
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="shadow-shelf-export-${Date.now()}.json"`,
      },
    })
  } catch (error: any) {
    console.error('Account export error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
