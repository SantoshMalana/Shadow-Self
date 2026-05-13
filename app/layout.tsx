import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Shadow Shelf',
  description: 'Cognitive Legacy Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[var(--bg)] text-[var(--text-primary)] antialiased selection:bg-[#3d3d3d] selection:text-white`}>
        {children}
      </body>
    </html>
  )
}
