import { NextRequest, NextResponse } from 'next/server'
import { generateChat } from '@/lib/llm'
import { getSystemPrompt } from '@/lib/prompts'
import { getPersonality, extractTraits, savePersonality } from '@/lib/personality'
import { storeMemory, recallMemories } from '@/lib/memory'
import { prisma } from '@/lib/prisma'
import { getDbUser } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { determineTurnGoal } from '@/lib/turn-goal'
import { maybeAdvanceDepthRung } from '@/lib/depth-rung'

export async function POST(req: NextRequest) {
  try {
    const user = await getDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rateCheck = checkRateLimit(user.id, 20, 60_000)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.', retryAfterMs: rateCheck.resetInMs },
        { status: 429 }
      )
    }

    const { messages, mode, question } = await req.json()
    
    // Safety check: Limit input length to prevent DoS or token blowout
    if (question && question.length > 2000) {
      return NextResponse.json({ error: 'Question too long.' }, { status: 400 })
    }
    const totalLength = messages.reduce((acc: number, m: any) => acc + (m.content?.length || 0), 0)
    if (totalLength > 20000) {
      return NextResponse.json({ error: 'Conversation history too long. Please start a new session.' }, { status: 400 })
    }

    const personality = await getPersonality(user.id)

    // Turn goal is now deterministic, not LLM-selected — see lib/turn-goal.ts
    const turnGoal =
      mode === 'onboarding' || mode === 'train'
        ? await determineTurnGoal(user.id)
        : undefined

    let systemPrompt = await getSystemPrompt(mode, user.depthRung, turnGoal)

    if ((mode === 'clone' || mode === 'onboarding') && messages.length > 0) {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
      if (lastUserMsg) {
        const memories = await recallMemories(user.id, lastUserMsg.content)
        if (memories.length > 0) {
          systemPrompt += `\n\nRELEVANT MEMORIES FROM YOUR TRAINING:\n${memories.map((m, i) => `${i + 1}. ${m}`).join('\n')}\n\nDraw on these naturally — don't quote them verbatim.`
        }
      }
    }

    const response = await generateChat(messages, systemPrompt)

    if (messages.length > 0) {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
      if (lastUserMsg) {
        await prisma.message.create({
          data: { userId: user.id, role: 'user', content: lastUserMsg.content, mode: mode ?? 'clone' },
        })
      }
    }

    await prisma.message.create({
      data: { userId: user.id, role: 'assistant', content: response, mode: mode ?? 'clone', turnGoal },
    })

    if ((mode === 'train' || mode === 'onboarding') && question && messages.length > 0) {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
      if (lastUserMsg) {
        // Execute background tasks independently to prevent cascading failures
        ;(async () => {
          try {
            const updated = await extractTraits(question, lastUserMsg.content, personality)
            await savePersonality(user.id, updated)
          } catch (err) {
            console.error('extractTraits task error:', err)
          }
        })();

        ;(async () => {
          try {
            await storeMemory(user.id, `Q: ${question}\nA: ${lastUserMsg.content}`, 'qa')
          } catch (err) {
            console.error('storeMemory task error:', err)
          }
        })();

        ;(async () => {
          try {
            await maybeAdvanceDepthRung(user.id)
          } catch (err) {
            console.error('maybeAdvanceDepthRung task error:', err)
          }
        })();
      }
    }

    return NextResponse.json({ response, turnGoal })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: error.message || 'Failed to get response from LLM' }, { status: 500 })
  }
}
