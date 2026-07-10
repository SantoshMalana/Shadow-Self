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
    return NextResponse.json({
      ...personality,
      name: user.name,
      memoriesCount: stats.totalMemories
    })
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

export async function DELETE(req: NextRequest) {
  try {
    const user = await getDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { category, traitIndex } = await req.json()
    if (!category || typeof traitIndex !== 'number') {
      return NextResponse.json({ error: 'Missing category or traitIndex' }, { status: 400 })
    }

    const personality = await getPersonality(user.id)
    
    if (personality[category] && Array.isArray(personality[category].traits)) {
      personality[category].traits.splice(traitIndex, 1)
      await savePersonality(user.id, personality)
      return NextResponse.json({ success: true, personality })
    }

    return NextResponse.json({ error: 'Invalid category or trait format' }, { status: 400 })
  } catch (error: any) {
    console.error('API Personality DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
