import { NextResponse } from 'next/server'
import { handleFrictionPing } from '@/lib/scout/pipeline'
import { FrictionPing } from '@/lib/scout/types'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Validate body...
    const ping: FrictionPing = {
      userId: body.userId, // In production, get this from auth context
      signalType: body.signalType,
      value: body.value,
      context: body.context,
    }

    // Fire and forget so we don't block the client
    handleFrictionPing(ping).catch(err => {
      console.error('Failed to process friction ping:', err)
    })

    return NextResponse.json({ success: true, queued: true })
  } catch (error) {
    console.error('Error in /api/scout/ping:', error)
    return NextResponse.json({ error: 'Failed to process ping' }, { status: 500 })
  }
}
