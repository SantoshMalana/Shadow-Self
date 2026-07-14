import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

function generateApiKey(): string {
  // Format: ss_live_<32 hex chars>
  return `ss_live_${randomBytes(16).toString('hex')}`
}

// GET — return existing API key (or generate one if missing)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate API key if not set
    if (!dbUser.apiKey) {
      const apiKey = generateApiKey()
      dbUser = await prisma.user.update({
        where: { id: user.id },
        data: { apiKey }
      })
    }

    return NextResponse.json({
      apiKey: dbUser.apiKey,
      hint: 'Keep this key secret. It grants access to your Shadow Shelf Scout data.'
    })
  } catch (err) {
    console.error('Error fetching API key:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — regenerate API key (invalidates old one)
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const newKey = generateApiKey()
    await prisma.user.update({
      where: { id: user.id },
      data: { apiKey: newKey }
    })

    return NextResponse.json({
      apiKey: newKey,
      message: 'API key regenerated. Your old key is now invalid.'
    })
  } catch (err) {
    console.error('Error regenerating API key:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
