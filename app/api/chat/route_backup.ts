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

    const { messages, mode, question, chatId } = await req.json()
    
    if (question && question.length > 2000) {
      return NextResponse.json({ error: 'Question too long.' }, { status: 400 })
    }
    const totalLength = messages.reduce((acc: number, m: any) => acc + (m.content?.length || 0), 0)
    if (totalLength > 20000) {
      return NextResponse.json({ error: 'Conversation history too long. Please start a new session.' }, { status: 400 })
    }

    const lastUserMsg = messages.length > 0 ? [...messages].reverse().find((m: any) => m.role === 'user') : null;

    let activeChatId = chatId

    if (!activeChatId && lastUserMsg) {
      // Generate a fast title from first 40 chars of message (no extra LLM call)
      const quickTitle = lastUserMsg.content.trim().slice(0, 40).split(' ').slice(0, 5).join(' ')

      const newSession = await prisma.chatSession.create({
        data: {
          userId: user.id,
          mode: mode || 'clone',
          title: quickTitle
        }
      })
      activeChatId = newSession.id

      // Fire-and-forget background LLM title refinement
      ;(async () => {
        try {
          const titlePrompt = `Generate a very short 2-4 word summary title for this message. No quotes, no punctuation, no explanation.\nMessage: "${lastUserMsg.content.slice(0, 200)}"`
          const aiTitle = await generateChat([{ role: 'user', content: titlePrompt }], 'You output only the title.', { escalate: false })
          if (aiTitle?.trim()) {
            await prisma.chatSession.update({
              where: { id: newSession.id },
              data: { title: aiTitle.trim().slice(0, 60) }
            })
          }
        } catch (e) { /* title stays as quick title */ }
      })()

    } else if (!activeChatId) {
      return NextResponse.json({ error: 'Cannot create empty chat session' }, { status: 400 })
    }

    const [turnGoal, memories, escalation, personality] = await Promise.all([
      (mode === 'onboarding' || mode === 'train') ? determineTurnGoal(user.id) : Promise.resolve(undefined),
      lastUserMsg ? recallMemories(user.id, lastUserMsg.content) : Promise.resolve([]),
      lastUserMsg ? Promise.resolve(classifyEscalation(lastUserMsg.content)) : Promise.resolve({ shouldEscalate: false } as EscalationResult),
      getPersonality(user.id)
    ])

    // Crisis logic removed per AGENTS.md hard constraint.

    let systemPrompt = await getSystemPrompt(mode, user.name || 'the user', user.depthRung, personality, turnGoal as any)
    let memoriesUsed = memories.length

    if (memoriesUsed > 0) {
      const memoryInstructions = (mode === 'train' || mode === 'onboarding')
        ? `You remember these things from previous conversations. Use them to show continuity — reference past topics naturally, build on what you already know, and avoid re-asking things you've already learned. This is what makes you feel like a companion, not a stranger.`
        : (mode === 'clone')
        ? `Draw on these naturally — don't quote them verbatim. Use them to ground your responses in real context.`
        : `Use these as context for your response where relevant.`
      
      systemPrompt += `\n\nRELEVANT MEMORIES FROM PREVIOUS CONVERSATIONS:\n${memories.map((m, i) => `${i + 1}. ${m}`).join('\n')}\n\n${memoryInstructions}`
    }

    let response = await generateChat(messages, systemPrompt, { escalate: escalation.shouldEscalate })

    // Crisis handling removed.

    let userMessageId: string | undefined
    if (lastUserMsg) {
      const saved = await prisma.message.create({
        data: { userId: user.id, role: 'user', content: lastUserMsg.content, mode: mode ?? 'clone', chatSessionId: activeChatId },
      })
      userMessageId = saved.id
    }

    const savedMessage = await prisma.message.create({
      data: { userId: user.id, role: 'assistant', content: response, mode: mode ?? 'clone', turnGoal, chatSessionId: activeChatId },
    })

    if (lastUserMsg) {
      // Always store user messages as memories for cross-session continuity
      ;(async () => {
        try {
          // Only store messages with meaningful content (> 20 chars)
          if (lastUserMsg.content.length > 20) {
            const memoryContent = question
              ? `Q: ${question}\nA: ${lastUserMsg.content}`
              : lastUserMsg.content
            await storeMemory(user.id, memoryContent, mode === 'jarvis' ? 'technical' : 'conversation')
          }
        } catch (err) { console.error('storeMemory task error:', err) }
      })()
    }

    if ((mode === 'train' || mode === 'onboarding') && lastUserMsg) {
        ;(async () => {
          try {
            const q = question || 'Free conversation'
            const updated = await extractTraits(q, lastUserMsg.content, personality, userMessageId)
            await savePersonality(user.id, updated)
          } catch (err) { console.error('extractTraits task error:', err) }
        })();
        ;(async () => {
          try {
            await maybeAdvanceDepthRung(user.id)
          } catch (err) { console.error('maybeAdvanceDepthRung task error:', err) }
        })();
    }

    if (lastUserMsg && lastUserMsg.content.length > 30) {
      ;(async () => {
        try {
          await processAndStoreZeroKnowledge(lastUserMsg.content)
        } catch (err) { console.error('zeroKnowledge task error:', err) }
      })()
    }

    // Update the ChatSession updatedAt timestamp so it jumps to top
    await prisma.chatSession.update({
      where: { id: activeChatId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({ response, turnGoal, messageId: savedMessage.id, memoriesUsed, chatId: activeChatId })
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
    const chatId = searchParams.get('chatId')

    if (!chatId) {
      return NextResponse.json({ messages: [] })
    }

    // Verify ownership
    const session = await prisma.chatSession.findUnique({ where: { id: chatId }})
    if (!session || session.userId !== user.id) {
       return NextResponse.json({ error: 'Unauthorized or not found' }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: { userId: user.id, chatSessionId: chatId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    })

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
