import type { Metadata } from 'next'
import Link from 'next/link'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { getAuthUser } from '@/lib/auth'
import SignOutButton from '@/components/SignOutButton'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'Shadow Shelf — Cognitive Legacy Platform',
  description: 'Build a living AI clone from daily conversation. Your thinking style, your voice, your opinions — preserved and interactive.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser(false)

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans bg-bg text-text-primary antialiased">
        {user && (
          <nav className="fixed top-0 left-0 w-full p-4 flex justify-end items-center gap-4 z-50 pointer-events-none">
            <div className="bg-card/90 backdrop-blur-md border border-border rounded-full px-5 py-2 flex items-center gap-6 pointer-events-auto shadow-lg">
              <Link href="/train" className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors">Train</Link>
              <Link href="/clone" className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors">Clone</Link>
              <Link href="/profile" className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors">Profile</Link>
              <Link href="/settings" className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors">Settings</Link>
              <div className="w-px h-4 bg-border" />
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
