import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/ollama'
import { getSystemPrompt } from '@/lib/prompts'
import { getPersonality, extractTraits, savePersonality } from '@/lib/personality'
import { storeMemory, recallMemories } from '@/lib/memory'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { messages, mode, question } = await req.json()

    // Get personality + its DB id
    const personality = await getPersonality()
    const personalityId = personality.id!

    // ── Clone mode: inject RAG context into system prompt ──────────────────
    let systemPrompt = await getSystemPrompt(mode)

    if (mode === 'clone' && messages.length > 0) {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
      if (lastUserMsg) {
        const memories = await recallMemories(personalityId, lastUserMsg.content)
        if (memories.length > 0) {
          systemPrompt += `\n\nRELEVANT MEMORIES FROM YOUR TRAINING:\n${memories.map((m, i) => `${i + 1}. ${m}`).join('\n')}\n\nDraw on these naturally — don't quote them verbatim.`
        }
      }
    }

    // ── Generate response ──────────────────────────────────────────────────
    const response = await chat(messages, systemPrompt)

    // ── Persist messages to DB ─────────────────────────────────────────────
    if (messages.length > 0) {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
      if (lastUserMsg) {
        await prisma.message.create({
          data: {
            personalityId,
            role: 'user',
            content: lastUserMsg.content,
            mode: mode ?? 'clone'
          }
        })
      }
    }

    await prisma.message.create({
      data: {
        personalityId,
        role: 'assistant',
        content: response,
        mode: mode ?? 'clone'
      }
    })

    // ── Training mode: extract traits + store memory ───────────────────────
    if (mode === 'train' && question && messages.length > 0) {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
      if (lastUserMsg) {
        // Extract & persist personality traits
        const updated = await extractTraits(question, lastUserMsg.content, personality)
        await savePersonality(updated)

        // Store as a searchable memory for RAG (fire-and-forget)
        void storeMemory(personalityId, `Q: ${question}\nA: ${lastUserMsg.content}`)
      }
    }

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get response from Ollama' },
      { status: 500 }
    )
  }
}
