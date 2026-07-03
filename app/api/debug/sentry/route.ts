import { NextResponse } from 'next/server'

export async function GET() {
  throw new Error('Sentry Test Error from Shadow Shelf')
  return NextResponse.json({ message: 'This should never be reached' })
}
