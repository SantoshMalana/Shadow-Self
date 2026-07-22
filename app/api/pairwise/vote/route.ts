import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const testId = searchParams.get('testId')
    
    if (!testId) {
      return NextResponse.json({ error: 'Missing testId' }, { status: 400 })
    }

    const test = await prisma.pairwiseTest.findUnique({
      where: { id: testId }
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Return the test without the answers, unless it's resolved
    return NextResponse.json({
      id: test.id,
      scenario: test.scenario,
      optionA: test.optionA,
      optionB: test.optionB,
      resolvedAt: test.resolvedAt,
      // Only reveal correct option if already voted
      correctOption: test.resolvedAt ? test.correctOption : null,
      votedOption: test.votedOption
    })
  } catch (error: any) {
    console.error('Pairwise GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch test' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { testId, votedOption, voterId } = await req.json()
    
    if (!testId || !['A', 'B'].includes(votedOption)) {
      return NextResponse.json({ error: 'Invalid testId or votedOption' }, { status: 400 })
    }

    const test = await prisma.pairwiseTest.findUnique({
      where: { id: testId }
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    if (test.resolvedAt) {
      return NextResponse.json({ error: 'Test already resolved' }, { status: 400 })
    }

    const updated = await prisma.pairwiseTest.update({
      where: { id: testId },
      data: {
        votedOption,
        votedBy: voterId || 'anonymous',
        resolvedAt: new Date()
      }
    })

    return NextResponse.json({
      correctOption: updated.correctOption,
      isCorrect: updated.correctOption === votedOption
    })
  } catch (error: any) {
    console.error('Pairwise vote error:', error)
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 })
  }
}
