import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'

/**
 * Resolves and validates an API key from the Authorization header.
 * Returns the userId if valid, null otherwise.
 * Used by all Scout API routes to authenticate VS Code extension requests.
 */
export async function resolveApiKey(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const apiKey = authHeader.slice(7).trim()

  // Allow internal server-to-server calls (no api key needed from the web app itself)
  if (!apiKey.startsWith('ss_live_')) {
    return null
  }

  try {
    const apiKeyHash = createHash('sha256').update(apiKey).digest('hex')
    const user = await prisma.user.findUnique({
      where: { apiKeyHash },
      select: { id: true }
    })
    return user?.id ?? null
  } catch {
    return null
  }
}
