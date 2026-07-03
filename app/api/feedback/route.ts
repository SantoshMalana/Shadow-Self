import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDbUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { messageId, rating, correctionText } = await req.json()

    if (!messageId || !rating || !['up', 'down'].includes(rating)) {
      return NextResponse.json({ error: 'Invalid feedback data' }, { status: 400 })
    }

    // Verify the message belongs to this user
    const message = await prisma.message.findFirst({
      where: { id: messageId, userId: user.id }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    await prisma.feedback.create({
      data: {
        userId: user.id,
        messageId,
        rating,
        correctionText: correctionText || null,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Feedback API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
