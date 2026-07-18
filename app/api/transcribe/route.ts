import { NextRequest, NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // 1. Secure the endpoint (must be logged in)
    const user = await getDbUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Strict rate limiting for expensive external API calls
    // Allow 15 voice inputs per minute per user
    const rateCheck = await checkRateLimit(`transcribe:${user.id}`, 15, 60_000)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many voice recordings. Please wait a minute.' },
        { status: 429 }
      )
    }

    const formData = await req.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json({ error: 'No audio file provided or file is empty' }, { status: 400 })
    }

    const isGroq = !!process.env.GROQ_API_KEY
    const apiKeys = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY

    if (!apiKeys) {
      return NextResponse.json({ error: 'OpenAI/Groq API key not configured' }, { status: 500 })
    }

    const endpoint = isGroq && !process.env.OPENAI_API_KEY 
      ? 'https://api.groq.com/openai/v1/audio/transcriptions' 
      : 'https://api.openai.com/v1/audio/transcriptions'

    const modelName = isGroq && !process.env.OPENAI_API_KEY ? 'whisper-large-v3-turbo' : 'whisper-1'

    const { withKeyRotation } = await import('@/lib/api-balancer')

    const result = await withKeyRotation(
      apiKeys,
      async (key) => {
        const whisperForm = new FormData()
        whisperForm.append('file', audioFile, audioFile.name)
        whisperForm.append('model', modelName)
        whisperForm.append('language', 'en')

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`
          },
          body: whisperForm
        })

        if (!response.ok) {
          const err = await response.text()
          throw new Error(`Whisper API error: ${response.status} - ${err}`)
        }

        return await response.json()
      },
      isGroq ? 'Groq (Whisper)' : 'OpenAI (Whisper)'
    )

    return NextResponse.json({ text: result.text })
  } catch (error: any) {
    console.error('Transcription error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
