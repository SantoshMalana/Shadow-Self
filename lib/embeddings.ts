// lib/embeddings.ts
export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.EMBEDDING_API_KEY
  const baseUrl = process.env.EMBEDDING_BASE_URL || 'https://api.openai.com/v1'
  const model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small'

  if (!apiKey || apiKey === 'your-embedding-api-key') {
    console.error(
      '[Embeddings] EMBEDDING_API_KEY is not set. Returning a zero-signal ' +
      'mock vector — memory retrieval will NOT return meaningful results ' +
      'until this is fixed. Check .env before assuming RAG is working.'
    )
    return Array(1536).fill(0.01)
  }

  const response = await fetch(`${baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: text, model, dimensions: 1536 }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Embeddings] API error — retrieval degraded for this call:', errorText)
    throw new Error(`Embedding API error: ${response.status}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}
