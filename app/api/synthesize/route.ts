import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { text, voiceId } = await req.json()

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const apiKeys = process.env.ELEVENLABS_API_KEY
    if (!apiKeys) {
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 })
    }

    // Use provided voice ID or fall back to a default ElevenLabs voice
    const targetVoiceId = voiceId || 'pNInz6obpgDQGcFmaJgB' // Adam (default)

    // Using the internal API balancer for dynamic fallback
    const { withKeyRotation } = await import('@/lib/api-balancer')
    
    const audioBuffer = await withKeyRotation(
      apiKeys,
      async (key) => {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': key,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              text,
              model_id: 'eleven_turbo_v2_5',
              voice_settings: {
                stability: 0.75,
                similarity_boost: 0.85,
                style: 0.1,
                use_speaker_boost: true
              }
            })
          }
        )

        if (!response.ok) {
          const err = await response.text()
          throw new Error(`ElevenLabs error: ${response.status} - ${err}`)
        }

        return await response.arrayBuffer()
      },
      'ElevenLabs (TTS)'
    )

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error: any) {
    console.error('Synthesis error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
