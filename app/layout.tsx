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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('shadow-shelf-theme');
                if (!theme) {
                  theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                }
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="font-sans bg-bg text-text-primary antialiased">
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}
