import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import { getAuthUser } from '@/lib/auth'
import SignOutButton from '@/components/SignOutButton'

export const metadata: Metadata = {
  title: 'Shadow Shelf',
  description: 'Cognitive Legacy Platform',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser(false) // Don't require auth here, just check

  return (
    <html lang="en">
      <body className="font-sans bg-neutral-950 text-neutral-200 antialiased selection:bg-neutral-700 selection:text-white">
        {user && (
          <nav className="fixed top-0 left-0 w-full p-4 flex justify-end items-center gap-4 z-50 pointer-events-none">
            <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-full px-5 py-2 flex items-center gap-6 pointer-events-auto">
              <Link href="/train" className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors">Onboarding</Link>
              <Link href="/clone" className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors">Clone Chat</Link>
              <Link href="/profile" className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors">Profile</Link>
              <Link href="/settings" className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors">Settings</Link>
              <div className="w-px h-4 bg-neutral-800" />
              <SignOutButton />
            </div>
          </nav>
        )}
        <main className={user ? 'pt-16' : ''}>
          {children}
        </main>
      </body>
    </html>
  )
}
