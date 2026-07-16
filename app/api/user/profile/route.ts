import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true }
    })

    return NextResponse.json({
      name: dbUser?.name || '',
      email: user.email || '',
    })
  } catch (err) {
    console.error('Error fetching profile:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
