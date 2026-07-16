import { NextRequest, NextResponse } from 'next/server'
import { resolveApiKey } from '@/lib/scout/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const userId = await resolveApiKey(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch unread interventions
    const deliveries = await prisma.scoutDelivery.findMany({
      where: {
        userId,
        read: false,
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (deliveries.length > 0) {
      // Mark as read
      await prisma.scoutDelivery.updateMany({
        where: {
          id: {
            in: deliveries.map(d => d.id)
          }
        },
        data: {
          read: true
        }
      })
    }

    return NextResponse.json({ deliveries })
  } catch (error) {
    console.error('Scout delivery poll error:', error)
    return NextResponse.json({ deliveries: [] })
  }
}
