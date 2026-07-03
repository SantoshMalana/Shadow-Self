import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDbUser } from '@/lib/auth'

const VALID_STREAMS = ['voice', 'text', 'memory', 'personality']

/**
 * GET /api/consent — returns the latest consent state for each stream.
 */
export async function GET() {
  try {
    const user = await getDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get latest entry for each stream
    const consents: Record<string, boolean> = {}

    for (const stream of VALID_STREAMS) {
      const latest = await prisma.consentLedger.findFirst({
        where: { userId: user.id, stream },
        orderBy: { timestamp: 'desc' },
      })
      consents[stream] = latest?.consented ?? false
    }

    return NextResponse.json({ consents })
  } catch (error: any) {
    console.error('Consent GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/consent — appends to the immutable consent ledger.
 * Body: { stream: string, consented: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { stream, consented } = await req.json()

    if (!VALID_STREAMS.includes(stream)) {
      return NextResponse.json({ error: `Invalid stream. Must be one of: ${VALID_STREAMS.join(', ')}` }, { status: 400 })
    }

    if (typeof consented !== 'boolean') {
      return NextResponse.json({ error: 'consented must be a boolean' }, { status: 400 })
    }

    // Get IP for audit trail
    const forwarded = req.headers.get('x-forwarded-for')
    const ipAddress = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null

    await prisma.consentLedger.create({
      data: {
        userId: user.id,
        stream,
        consented,
        ipAddress,
      }
    })

    return NextResponse.json({ success: true, stream, consented })
  } catch (error: any) {
    console.error('Consent POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
