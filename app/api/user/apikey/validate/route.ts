import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Validates API key and returns userId + name
// Called by the VS Code extension on first setup
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 })
    }

    const apiKey = authHeader.slice(7).trim()
    if (!apiKey.startsWith('ss_live_')) {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { apiKey },
      select: { id: true, name: true, email: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'API key not found or revoked' }, { status: 401 })
    }

    return NextResponse.json({
      userId: user.id,
      name: user.name ?? user.email,
      message: 'Valid'
    })
  } catch (err) {
    console.error('Error validating API key:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
