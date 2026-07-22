import { NextRequest, NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPersonality } from '@/lib/personality'
import { generateChat } from '@/lib/llm'
import { getSystemPrompt } from '@/lib/prompts'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const user = await getDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { scenario, userAnswer } = await req.json()
    
    if (!scenario || !userAnswer) {
      return NextResponse.json({ error: 'Missing scenario or userAnswer' }, { status: 400 })
    }

    const personality = await getPersonality(user.id)
    const systemPrompt = await getSystemPrompt('clone', user.name || 'the user', user.depthRung, personality)
    
    const messages = [
      { role: 'user', content: `Please provide a thoughtful answer to the following scenario based on your persona.\n\nScenario: ${scenario}` }
    ]
    
    const cloneAnswer = await generateChat(messages, systemPrompt, { escalate: true })

    // Randomize A and B
    const isUserA = Math.random() < 0.5
    const optionA = isUserA ? userAnswer : cloneAnswer
    const optionB = isUserA ? cloneAnswer : userAnswer
    const correctOption = isUserA ? 'A' : 'B'

    const test = await prisma.pairwiseTest.create({
      data: {
        userId: user.id,
        scenario,
        userAnswer,
        cloneAnswer,
        optionA,
        optionB,
        correctOption
      }
    })

    return NextResponse.json({ testId: test.id, optionA, optionB })
  } catch (error: any) {
    console.error('Pairwise generate error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate test' }, { status: 500 })
  }
}
