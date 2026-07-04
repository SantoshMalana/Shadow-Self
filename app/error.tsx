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
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-10 font-sans text-neutral-200">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-6 opacity-30 text-red-500">◈</div>
        <h2 className="text-2xl font-medium mb-3 text-red-400">
          Neural Pathway Error
        </h2>
        <p className="text-sm text-neutral-500 leading-relaxed mb-4">
          A critical system error occurred during processing.
        </p>
        <p className="text-xs text-neutral-600 mb-8 p-3 bg-neutral-900 rounded-lg overflow-hidden text-ellipsis whitespace-nowrap">
          {error.message || 'Unknown exception'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 rounded-xl font-medium text-sm transition-all bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
          >
            Retry
          </button>
          <Link href="/" className="px-6 py-3 rounded-xl font-medium text-sm transition-all bg-neutral-100 text-neutral-900 hover:bg-white">
            ← Home
          </Link>
        </div>
      </div>
    </div>
  )
}
