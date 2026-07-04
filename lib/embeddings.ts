// lib/embeddings.ts
import { withKeyRotation } from './api-balancer'

export async function getEmbedding(text: string): Promise<number[]> {
  const keysString = process.env.EMBEDDING_API_KEY

  if (!keysString || keysString === 'your-embedding-api-key') {
    console.error(
      '[Embeddings] EMBEDDING_API_KEY is not set. Returning a zero-signal ' +
      'mock vector — memory retrieval will NOT return meaningful results ' +
      'until this is fixed. Check .env before assuming RAG is working.'
    )
    return Array(768).fill(0.01)
  }

  return withKeyRotation(
    keysString,
    async (key) => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/gemini-embedding-2',
            content: { parts: [{ text }] },
            outputDimensionality: 768,
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Embeddings] API error — retrieval degraded for this call:', errorText)
        throw new Error(`Embedding API error: ${response.status}`)
      }

      const data = await response.json()
      return data.embedding.values
    },
    'Google AI Studio (gemini-embedding-2)'
  )
}
