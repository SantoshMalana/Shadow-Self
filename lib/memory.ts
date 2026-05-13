import { prisma } from './prisma'
import { ollama } from './ollama'

const EMBED_MODEL = 'nomic-embed-text'

// ─── Embedding ─────────────────────────────────────────────────────────────

export async function embedText(text: string): Promise<number[]> {
  try {
    const response = await ollama.embed({
      model: EMBED_MODEL,
      input: text
    })
    // ollama.embed returns { embeddings: number[][] }
    return response.embeddings[0]
  } catch (error) {
    console.error('Embedding error:', error)
    throw new Error('Failed to generate embedding. Is nomic-embed-text pulled?')
  }
}

// ─── Cosine Similarity ─────────────────────────────────────────────────────

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

// ─── Store Memory ──────────────────────────────────────────────────────────

export async function storeMemory(
  personalityId: string,
  content: string
): Promise<void> {
  try {
    const embedding = await embedText(content)
    await prisma.memory.create({
      data: {
        personalityId,
        content,
        embedding: JSON.stringify(embedding)
      }
    })
  } catch (error) {
    // Non-fatal — RAG degrades gracefully if Ollama embed model isn't ready
    console.warn('Memory store failed (non-fatal):', error)
  }
}

// ─── Recall Memories ───────────────────────────────────────────────────────

export async function recallMemories(
  personalityId: string,
  query: string,
  topK = 5
): Promise<string[]> {
  try {
    const allMemories = await prisma.memory.findMany({
      where: { personalityId },
      select: { content: true, embedding: true },
      orderBy: { created_at: 'desc' },
      take: 200
    })

    if (allMemories.length === 0) return []

    const queryEmbedding = await embedText(query)

    const scored = allMemories.map(m => ({
      content: m.content,
      score: cosineSimilarity(queryEmbedding, JSON.parse(m.embedding))
    }))

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter(m => m.score > 0.3) // threshold — only relevant memories
      .map(m => m.content)
  } catch (error) {
    // Non-fatal — if embedding fails, clone still works, just without RAG
    console.warn('Memory recall failed (non-fatal):', error)
    return []
  }
}

// ─── Memory Stats ──────────────────────────────────────────────────────────

export async function getMemoryStats(personalityId: string) {
  const total = await prisma.memory.count({ where: { personalityId } })
  const recent = await prisma.memory.findMany({
    where: { personalityId },
    orderBy: { created_at: 'desc' },
    take: 5,
    select: { content: true, created_at: true }
  })
  return { total, recent }
}
