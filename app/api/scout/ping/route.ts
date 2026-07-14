import { NextRequest, NextResponse } from 'next/server'
import { handleFrictionPing } from '@/lib/scout/pipeline'
import { FrictionPing } from '@/lib/scout/types'
import { resolveApiKey } from '@/lib/scout/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Try API key auth first (VS Code extension)
    let userId = await resolveApiKey(req)

    // Fall back to session auth (web app internal calls)
    if (!userId) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? body.userId
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ping: FrictionPing = {
      userId,
      signalType: body.signalType,
      value: body.value,
      context: body.context,
    }

    // Fire and forget — never block the caller
    handleFrictionPing(ping).catch(err => {
      console.error('Failed to process friction ping:', err)
    })

    return NextResponse.json({ success: true, queued: true })
  } catch (error) {
    console.error('Error in /api/scout/ping:', error)
    return NextResponse.json({ error: 'Failed to process ping' }, { status: 500 })
  }
}
