import { prisma } from '@/lib/prisma'
import { getEmbedding } from '@/lib/embeddings'

/**
 * Stores a new memory into the pgvector Memory table.
 */
export async function storeMemory(userId: string, content: string, category: string = 'general') {

  
  // 1. Get embedding
  const embedding = await getEmbedding(content)
  
  // 2. Insert via raw SQL to handle Unsupported("vector")
  // Using Prisma's parameterized query syntax for safety
  await prisma.$executeRaw`
    INSERT INTO memories (user_id, content, category, embedding)
    VALUES (
      ${userId}::uuid, 
      ${content}, 
      ${category}, 
      ${embedding}::vector
    )
  `
  

}

/**
 * Recalls memories using vector similarity search (cosine distance).
 */
export async function recallMemories(userId: string, query: string, limit = 5): Promise<string[]> {

  
  // 1. Embed the query
  const queryEmbedding = await getEmbedding(query)
  
  // 2. Search using pgvector cosine distance operator (<=>)
  const results = await prisma.$queryRaw<{ content: string; distance: number }[]>`
    SELECT content, embedding <=> ${queryEmbedding}::vector AS distance
    FROM memories
    WHERE user_id = ${userId}::uuid
    ORDER BY distance ASC
    LIMIT ${limit}
  `

  // 3. Filter out things that are too far away (distance threshold)
  // Distance is 0 (identical) to 2 (opposites). Usually < 0.5 is a good match.
  const relevant = results.filter(r => r.distance < 0.6)
  
  return relevant.map(r => r.content)
}

/**
 * Basic stats for the dashboard.
 */
export async function getMemoryStats(userId: string) {
  const count = await prisma.memory.count({
    where: { userId }
  })
  return { totalMemories: count }
}
