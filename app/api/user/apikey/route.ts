import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { randomBytes, createHash } from 'crypto'

function generateApiKey(): string {
  // Format: ss_live_<32 hex chars>
  return `ss_live_${randomBytes(16).toString('hex')}`
}

function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
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
    if (!dbUser.apiKeyHash) {
      const apiKey = generateApiKey()
      const apiKeyHash = hashApiKey(apiKey)
      dbUser = await prisma.user.update({
        where: { id: user.id },
        data: { apiKeyHash }
      })
      // Only return plaintext once upon creation
      return NextResponse.json({
        apiKey: apiKey,
        hint: 'Keep this key secret. It grants access to your Shadow Shelf Scout data. This is the only time it will be shown.'
      })
    }

    return NextResponse.json({
      apiKey: 'ss_live_********************************', // Masked key
      hint: 'Your API key is set but hidden for security. Regenerate to get a new one.'
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
    const apiKeyHash = hashApiKey(newKey)
    await prisma.user.update({
      where: { id: user.id },
      data: { apiKeyHash }
    })

    return NextResponse.json({
      apiKey: newKey,
      message: 'API key regenerated. Your old key is now invalid. Please copy this new key.'
    })
  } catch (err) {
    console.error('Error regenerating API key:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
