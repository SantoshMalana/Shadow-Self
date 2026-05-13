import { NextResponse } from 'next/server'
import { isOllamaRunning } from '@/lib/ollama'

export async function GET() {
  const running = await isOllamaRunning()
  return NextResponse.json({ running })
}
