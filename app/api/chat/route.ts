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
import { classifyEscalation, type EscalationResult } from '@/lib/escalation'
import { processAndStoreZeroKnowledge } from '@/lib/zero-knowledge'

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

    const lastUserMsg = messages.length > 0 ? [...messages].reverse().find((m: any) => m.role === 'user') : null;

    // Parallelize pre-flight requests: turnGoal, memories, escalation classification, and personality
    const [turnGoal, memories, escalation, personality] = await Promise.all([
      (mode === 'onboarding' || mode === 'train') ? determineTurnGoal(user.id) : Promise.resolve(undefined),
      ((mode === 'clone' || mode === 'onboarding') && lastUserMsg) ? recallMemories(user.id, lastUserMsg.content) : Promise.resolve([]),
      lastUserMsg ? Promise.resolve(classifyEscalation(lastUserMsg.content)) : Promise.resolve({ shouldEscalate: false } as EscalationResult),
      getPersonality(user.id)
    ])

    if (escalation.shouldEscalate) {

    }

    let systemPrompt = await getSystemPrompt(mode, user.name || 'the user', user.depthRung, personality, turnGoal as any)
    let memoriesUsed = memories.length

    if (memoriesUsed > 0) {
      systemPrompt += `\n\nRELEVANT MEMORIES FROM YOUR TRAINING:\n${memories.map((m, i) => `${i + 1}. ${m}`).join('\n')}\n\nDraw on these naturally — don't quote them verbatim.`
    }

    const response = await generateChat(messages, systemPrompt, { escalate: escalation.shouldEscalate })

    // Save user message first so we have the ID for provenance
    let userMessageId: string | undefined
    if (messages.length > 0) {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
      if (lastUserMsg) {
        const saved = await prisma.message.create({
          data: { userId: user.id, role: 'user', content: lastUserMsg.content, mode: mode ?? 'clone' },
        })
        userMessageId = saved.id
      }
    }

    const savedMessage = await prisma.message.create({
      data: { userId: user.id, role: 'assistant', content: response, mode: mode ?? 'clone', turnGoal },
    })

    if ((mode === 'train' || mode === 'onboarding') && question && messages.length > 0) {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
      if (lastUserMsg) {
        // Execute background tasks independently to prevent cascading failures
        ;(async () => {
          try {
            const updated = await extractTraits(question, lastUserMsg.content, personality, userMessageId)
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

        // Zero Knowledge Distillation — extract anonymous cognitive insights
        ;(async () => {
          try {
            await processAndStoreZeroKnowledge(lastUserMsg.content)
          } catch (err) {
            console.error('zeroKnowledge task error:', err)
          }
        })();
      }
    }

    return NextResponse.json({ response, turnGoal, messageId: savedMessage.id, memoriesUsed })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: error.message || 'Failed to get response from LLM' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('mode') || 'clone'

    const messages = await prisma.message.findMany({
      where: { userId: user.id, mode },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })

    // Map Prisma models to the simple Message interface expected by frontend
    const history = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      turnGoal: msg.turnGoal || undefined,
      messageId: msg.id
    }))

    return NextResponse.json({ messages: history })
  } catch (error: any) {
    console.error('Fetch history error:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
