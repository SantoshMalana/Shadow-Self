import { chat as ollamaChat } from './ollama'

/**
 * Universal LLM interface that supports "plug and play" OpenRouter.
 * Falls back to local Ollama if OPENROUTER_API_KEY is not set.
 */
export async function generateChat(messages: any[], systemPrompt?: string): Promise<string> {
  const openRouterKey = process.env.OPENROUTER_API_KEY
  
  if (!openRouterKey || openRouterKey === 'your-openrouter-api-key') {
    // Fallback to local Ollama
    console.log('[LLM] Using local Ollama fallback')
    return ollamaChat(messages, systemPrompt || '')
  }

  console.log('[LLM] Using OpenRouter')
  
  // Format for OpenRouter
  const formattedMessages = []
  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt })
  }
  formattedMessages.push(...messages)

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', 
      'X-Title': 'Shadow Shelf',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat',
      messages: formattedMessages,
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('OpenRouter error:', errorText)
    throw new Error(`OpenRouter API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}
