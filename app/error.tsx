'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Next.js caught error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-10 font-sans text-text-primary">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-6 opacity-80 text-red-500">◈</div>
        <h2 className="text-2xl font-bold mb-3 text-red-600">
          Neural Pathway Error
        </h2>
        <p className="text-sm text-text-muted leading-relaxed mb-4">
          A critical system error occurred during processing.
        </p>
        <p className="text-xs text-text-muted mb-8 p-3 bg-red-50 border border-red-100 rounded-lg overflow-hidden text-ellipsis whitespace-nowrap">
          {error.message || 'Unknown exception'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 rounded-xl font-medium text-sm transition-all bg-surface text-text-primary border border-border hover:bg-border"
          >
            Retry
          </button>
          <Link href="/" className="px-6 py-3 rounded-xl font-medium text-sm transition-all bg-text-primary text-white hover:bg-neutral-800">
            ← Home
          </Link>
        </div>
      </div>
    </div>
  )
}
