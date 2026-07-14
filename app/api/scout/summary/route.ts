import { NextRequest, NextResponse } from 'next/server'
import { generateSessionSummary } from '@/lib/scout/summary'
import { resolveApiKey } from '@/lib/scout/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    // Dual auth: API key (extension) or session (web app)
    let userId = await resolveApiKey(req)

    if (!userId) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? new URL(req.url).searchParams.get('userId')
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const summary = await generateSessionSummary(userId)

    return NextResponse.json({ summary })
  } catch (error) {
    // Graceful degradation — return empty summary, not 500
    return NextResponse.json({ summary: 'Summary unavailable right now.' })
  }
}
