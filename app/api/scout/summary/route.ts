import { NextResponse } from 'next/server'
import { generateSessionSummary } from '@/lib/scout/summary'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const summary = await generateSessionSummary(userId)

    return NextResponse.json({ summary })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
