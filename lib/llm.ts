import { chat as ollamaChat } from './ollama'
import { withKeyRotation } from './api-balancer'

/**
 * Universal LLM interface — provider-agnostic.
 *
 * Driven entirely by environment variables:
 *   LLM_API_KEY   — comma-separated keys for rotation (e.g. Groq, Gemini, or OpenRouter)
 *   LLM_BASE_URL  — base URL of the OpenAI-compatible endpoint
 *   LLM_MODEL     — the model string passed to the provider
 *
 * Provider quick-reference:
 *   Groq:         LLM_BASE_URL=https://api.groq.com/openai/v1
 *                 LLM_MODEL=openai/gpt-oss-120b
 *   Gemini:       LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
 *                 LLM_MODEL=gemini-2.0-flash
 *   OpenRouter:   LLM_BASE_URL=https://openrouter.ai/api/v1
 *                 LLM_MODEL=deepseek/deepseek-chat
 *
 * Falls back to local Ollama if LLM_API_KEY is not set.
 */
export async function generateChat(messages: any[], systemPrompt?: string): Promise<string> {
  const llmKeys = process.env.LLM_API_KEY
  const baseUrl = (process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '')
  const model   = process.env.LLM_MODEL || 'openai/gpt-oss-120b'

  if (!llmKeys || llmKeys === 'your-llm-api-key') {
    console.log('[LLM] LLM_API_KEY not set — falling back to local Ollama')
    return ollamaChat(messages.map((m: any) => ({ role: m.role, content: m.content })), systemPrompt || '')
  }

  // Determine a human-readable provider name for logs
  const providerName = baseUrl.includes('groq')
    ? 'Groq'
    : baseUrl.includes('googleapis')
    ? 'Google AI Studio'
    : baseUrl.includes('openrouter')
    ? 'OpenRouter'
    : 'LLM Provider'

  console.log(`[LLM] Using ${providerName} — model: ${model}`)

  const formattedMessages: { role: string; content: string }[] = []
  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt })
  }
  formattedMessages.push(...messages.map((m: any) => ({ role: m.role, content: m.content })))

  return withKeyRotation(
    llmKeys,
    async (key) => {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages: formattedMessages }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[LLM] ${providerName} error:`, errorText)
        throw new Error(`LLM API error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    },
    providerName
  )
}
