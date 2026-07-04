import type { Metadata } from 'next'
import Link from 'next/link'
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { getAuthUser } from '@/lib/auth'
import SignOutButton from '@/components/SignOutButton'

// Fonts configuration
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'Shadow Shelf',
  description: 'Cognitive Legacy Platform',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser(false) // Don't require auth here, just check

  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans bg-bg text-text-primary antialiased selection:bg-accent-cold selection:text-white">
        {user && (
          <nav className="fixed top-0 left-0 w-full p-4 flex justify-end items-center gap-4 z-50 pointer-events-none">
            {/* The Master Design says the interior UI gets quieter. The nav is calm, present, not performing. */}
            <div className="bg-surface border border-border/50 rounded-full px-5 py-2 flex items-center gap-6 pointer-events-auto shadow-md">
              <Link href="/train" className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors">Onboarding</Link>
              <Link href="/clone" className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors">Clone Chat</Link>
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
