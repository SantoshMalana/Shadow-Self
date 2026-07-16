'use client'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-10 font-sans text-text-primary">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6 opacity-20 text-text-muted font-light tracking-tighter">404</div>
        <h2 className="text-2xl font-bold mb-3 text-text-primary">
          Memory Not Found
        </h2>
        <p className="text-sm text-text-muted leading-relaxed mb-8">
          The page you are looking for has been forgotten or does not exist in the neural pathways.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all bg-text-primary text-white hover:bg-neutral-800">
          ← Return to Core
        </Link>
      </div>
    </div>
  )
}
