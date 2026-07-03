import { NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { getMemoryStats } from '@/lib/memory'

export async function GET() {
  try {
    const user = await getDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const stats = await getMemoryStats(user.id)
    return NextResponse.json({
      userId: user.id,
      name: user.name,
      memory: stats
    })
  } catch (error: any) {
    console.error("API Memory GET error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
