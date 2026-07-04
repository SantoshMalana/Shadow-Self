'use client'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-10 font-sans text-neutral-200">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6 opacity-20 text-neutral-500 font-light tracking-tighter">404</div>
        <h2 className="text-2xl font-medium mb-3 text-neutral-100">
          Memory Not Found
        </h2>
        <p className="text-sm text-neutral-500 leading-relaxed mb-8">
          The page you are looking for has been forgotten or does not exist in the neural pathways.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all bg-neutral-100 text-neutral-900 hover:bg-white">
          ← Return to Core
        </Link>
      </div>
    </div>
  )
}
