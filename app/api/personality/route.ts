import { NextRequest, NextResponse } from 'next/server'
import { getPersonality, savePersonality } from '@/lib/personality'
import { getMemoryStats } from '@/lib/memory'

export async function GET() {
  try {
    const personality = await getPersonality()
    const stats = await getMemoryStats(personality.id!)
    return NextResponse.json({ ...personality, memoriesCount: stats.total })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const updates = await req.json()
    const existing = await getPersonality()
    const updated = {
      ...existing,
      ...updates,
      created_at: existing.created_at || new Date().toISOString()
    }
    await savePersonality(updated)
    return NextResponse.json({ success: true, personality: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
