import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDbUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('mode')

    if (!mode) {
      return NextResponse.json({ error: 'Mode is required' }, { status: 400 })
    }

    const chats = await prisma.chatSession.findMany({
      where: {
        userId: user.id,
        mode,
        isActive: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({ chats })
  } catch (error: any) {
    console.error('Fetch chats error:', error)
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 })
  }
}
