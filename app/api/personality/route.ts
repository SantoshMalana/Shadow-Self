import { NextRequest, NextResponse } from 'next/server'
import { getPersonality, savePersonality } from '@/lib/personality'
import { getMemoryStats } from '@/lib/memory'
import { getDbUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const personality = await getPersonality(user.id)
    const stats = await getMemoryStats(user.id)
    return NextResponse.json({ ...personality, memoriesCount: stats.totalMemories })
  } catch (error: any) {
    console.error('API Personality GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const updates = await req.json()
    const existing = await getPersonality(user.id)
    const updated = {
      ...existing,
      ...updates,
      createdAt: existing.createdAt || new Date().toISOString()
    }
    
    await savePersonality(user.id, updated)
    return NextResponse.json({ success: true, personality: updated })
  } catch (error: any) {
    console.error('API Personality POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
