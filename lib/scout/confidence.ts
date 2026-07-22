import { getEmbedding } from '@/lib/embeddings'
import { prisma } from '@/lib/prisma'
import { FrictionPing } from './types'

export interface ConfidenceScores {
  stuckConfidence: number
  contentConfidence: number
  memorySnippet?: string
}

export async function scoreConfidence(
  userId: string, 
  ping: FrictionPing, 
  isAnomalous: boolean
): Promise<ConfidenceScores> {
  // Score 1: Stuck Confidence (0 to 1)
  let stuckConfidence = isAnomalous ? 0.8 : 0.3

  // Score 2: Helpful Content Confidence
  const relevantMemory = await fetchRelevantMemory(userId, ping)
  
  let contentConfidence = 0.0
  if (relevantMemory) {
    // Inverse relationship: closer distance = higher confidence
    // We cap it at 0.95
    contentConfidence = Math.min(0.95, 1.0 - relevantMemory.distance)
  }

  return {
    stuckConfidence,
    contentConfidence,
    memorySnippet: relevantMemory?.content,
  }
}

// Vector fetcher from both personal memory and zero-knowledge abstract layer
async function fetchRelevantMemory(userId: string, ping: FrictionPing): Promise<{ content: string, distance: number } | null> {
  try {
    const query = `Developer is struggling with: ${ping.signalType} ${ping.context ? JSON.stringify(ping.context) : ''}`
    const queryEmbedding = await getEmbedding(query)

    const vectorStr = `[${queryEmbedding.join(',')}]`

    // Search personal memories
    const personalResults = await prisma.$queryRaw<{ content: string; distance: number }[]>`
      SELECT content, embedding <=> ${vectorStr}::vector AS distance
      FROM memories
      WHERE user_id = ${userId}::uuid
      ORDER BY distance ASC
      LIMIT 1
    `

    // Search zero-knowledge aggregate models
    const globalResults = await prisma.$queryRaw<{ content: string; distance: number }[]>`
      SELECT insight AS content, embedding <=> ${vectorStr}::vector AS distance
      FROM anonymous_cognitive_model
      ORDER BY distance ASC
      LIMIT 1
    `

    const bestPersonal = personalResults[0]
    const bestGlobal = globalResults[0]

    let bestMatch = null
    if (bestPersonal && bestGlobal) {
      bestMatch = bestPersonal.distance < bestGlobal.distance ? bestPersonal : bestGlobal
    } else {
      bestMatch = bestPersonal || bestGlobal
    }

    // Threshold of 0.6 distance
    if (bestMatch && bestMatch.distance < 0.6) {
      return bestMatch
    }
    return null
  } catch (err) {
    console.error('Failed to fetch relevant memory for Scout:', err)
    return null
  }
}
