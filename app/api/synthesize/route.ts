import { NextRequest, NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  try {
    // 1. Secure the endpoint
    const user = await getDbUser()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // 2. Strict rate limiting for TTS API
    const rateCheck = checkRateLimit(`synthesize:${user.id}`, 20, 60_000)
    if (!rateCheck.allowed) {
      return new NextResponse('Too many voice generations. Please wait a minute.', { status: 429 })
    }

    const url = new URL(req.url)
    const text = url.searchParams.get('text')
    const voiceId = url.searchParams.get('voiceId') || 'pNInz6obpgDQGcFmaJgB' // Adam (default)

    if (!text) {
      return new NextResponse('No text provided', { status: 400 })
    }

    const apiKeys = process.env.ELEVENLABS_API_KEY
    if (!apiKeys) {
      return new NextResponse('ElevenLabs API key not configured', { status: 500 })
    }

    const { withKeyRotation } = await import('@/lib/api-balancer')
    
    // Return the response stream directly to enable fast streaming (1-2s latency)
    return await withKeyRotation(
      apiKeys,
      async (key) => {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=2`,
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

        return new NextResponse(response.body, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Transfer-Encoding': 'chunked',
            'Cache-Control': 'no-cache'
          }
        })
      },
      'ElevenLabs (TTS)'
    )

  } catch (error: any) {
    console.error('Synthesis error:', error)
    return new NextResponse(error.message, { status: 500 })
  }
}

