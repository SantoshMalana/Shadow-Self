import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { prisma } from '@/lib/prisma'

export default async function VSCodeAuthPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // If not logged in, force them to login and come back here
  if (!session?.user) {
    redirect('/login?next=/vscode-auth')
  }

  // Fetch API key securely on the server
  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { apiKey: true, name: true }
  })

  // Generate an API key if they don't have one yet
  if (user && !user.apiKey) {
    const newKey = `ss_live_${crypto.randomUUID().replace(/-/g, '')}`
    user = await prisma.user.update({
      where: { id: session.user.id },
      data: { apiKey: newKey },
      select: { apiKey: true, name: true }
    })
  }

  if (!user || !user.apiKey) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6 font-sans">
        <div className="text-center space-y-4">
          <p className="text-red-600">Error: Could not retrieve API key.</p>
          <Link href="/settings" className="btnPrimaryLg">Go to Settings</Link>
        </div>
      </div>
    )
  }

  const extensionLink = `vscode://shadow-shelf.shadow-shelf/auth?key=${user.apiKey}`

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* Background FX */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--color-accent-purple)]/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 bg-white border border-border rounded-[var(--radius-lg)] p-10 max-w-md w-full text-center space-y-8 animate-fade-in-up shadow-[0_24px_60px_-20px_rgba(0,0,0,0.1)]">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-[var(--color-accent-purple)]/5 rounded-2xl flex items-center justify-center border border-[var(--color-accent-purple)]/10 text-3xl shadow-[0_0_30px_rgba(131,40,249,0.15)]">
            ⚡
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Connect VS Code</h1>
          <p className="text-text-muted text-sm leading-relaxed">
            You're signed in as <strong className="text-text-primary">{user.name || session.user.email}</strong>. 
            Click the button below to instantly connect your editor to Jarvis Mode.
          </p>
        </div>

        <a 
          href={extensionLink}
          className="btnPrimaryLg w-full flex justify-center items-center gap-2"
        >
          Open in VS Code ↗
        </a>

        <p className="text-xs text-text-faint">
          Your browser may ask for permission to open Visual Studio Code.
        </p>
      </div>

      <Script id="auto-redirect" strategy="afterInteractive">
        {`
          setTimeout(function() {
            window.location.href = "${extensionLink}";
          }, 1000);
        `}
      </Script>
    </div>
  )
}
