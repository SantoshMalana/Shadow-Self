import { NextRequest, NextResponse } from 'next/server'
import { processWorkflowBoundary } from '@/lib/scout/pipeline'
import { WorkflowBoundary } from '@/lib/scout/types'
import { resolveApiKey } from '@/lib/scout/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    let userId = await resolveApiKey(req)

    if (!userId) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? body.userId
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    processWorkflowBoundary(userId, body.boundary as WorkflowBoundary).catch(err => {
      console.error('Failed to process boundary:', err)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process boundary' }, { status: 500 })
  }
}
