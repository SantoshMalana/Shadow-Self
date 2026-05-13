import { Ollama } from 'ollama'

export const ollama = new Ollama({ host: 'http://localhost:11434' })

export async function chat(
  messages: { role: string; content: string }[],
  systemPrompt: string
): Promise<string> {
  try {
    const response = await ollama.chat({
      model: 'phi3:mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      stream: false
    })
    return response.message.content
  } catch (error) {
    console.error('Ollama chat error:', error)
    throw new Error('Failed to connect to Ollama. Make sure Ollama is running locally.')
  }
}

export async function isOllamaRunning(): Promise<boolean> {
  try {
    await ollama.list()
    return true
  } catch {
    return false
  }
}
