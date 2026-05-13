import { NextResponse } from 'next/server'
import { getPersonality } from '@/lib/personality'
import { getMemoryStats } from '@/lib/memory'

export async function GET() {
  try {
    const personality = await getPersonality()
    const stats = await getMemoryStats(personality.id!)
    return NextResponse.json({
      personalityId: personality.id,
      name: personality.name,
      memory: stats
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
