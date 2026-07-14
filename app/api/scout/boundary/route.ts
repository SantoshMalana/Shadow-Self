import { NextResponse } from 'next/server'
import { processWorkflowBoundary } from '@/lib/scout/pipeline'
import { WorkflowBoundary } from '@/lib/scout/types'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, boundary } = body

    // Fire and forget
    processWorkflowBoundary(userId, boundary as WorkflowBoundary).catch(err => {
      console.error('Failed to process boundary:', err)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process boundary' }, { status: 500 })
  }
}
