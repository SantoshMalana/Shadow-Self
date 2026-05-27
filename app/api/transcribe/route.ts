import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    const isGroq = !!process.env.GROQ_API_KEY
    const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI/Groq API key not configured' }, { status: 500 })
    }

    // Send to Whisper API
    const whisperForm = new FormData()
    whisperForm.append('file', audioFile, audioFile.name)
    whisperForm.append('model', isGroq && !process.env.OPENAI_API_KEY ? 'whisper-large-v3-turbo' : 'whisper-1')
    whisperForm.append('language', 'en')

    const endpoint = isGroq && !process.env.OPENAI_API_KEY 
      ? 'https://api.groq.com/openai/v1/audio/transcriptions' 
      : 'https://api.openai.com/v1/audio/transcriptions'

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: whisperForm
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Whisper API error: ${err}`)
    }

    const result = await response.json()
    return NextResponse.json({ text: result.text })
  } catch (error: any) {
    console.error('Transcription error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
