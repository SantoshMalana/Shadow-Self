import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDbUser } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const user = await getDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { chatId } = await params

    const chat = await prisma.chatSession.findUnique({
      where: { id: chatId }
    })

    if (!chat || chat.userId !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
    }

    await prisma.chatSession.delete({
      where: { id: chatId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete chat error:', error)
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 })
  }
}
