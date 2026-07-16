'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import Link from 'next/link'

export default function LoginPage() {
  const [state, action, isPending] = useActionState(
    async (_prevState: any, formData: FormData) => {
      const result = await login(formData)
      return result || { error: '' }
    },
    { error: '' }
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-bg">
      <div className="lightFx" aria-hidden="true">
        <div className="raySource" />
        <div className="rays" />
      </div>

      <div className="w-full max-w-[400px] relative z-10">
        <div className="flex items-center justify-center gap-2.5 mb-12">
          <span className="w-7 h-7 shrink-0 rounded-full shadow-[var(--shadow-glow-sm)] avatar-gradient"  />
          <span className="font-bold text-lg tracking-tight text-text-primary">Shadow Shelf</span>
        </div>

        <div className="bg-white border border-border rounded-[var(--radius-lg)] p-9 sm:p-10 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.1)]">
          <h1 className="text-2xl font-bold text-center mb-1.5 text-text-primary">Welcome back</h1>
          <p className="text-sm text-text-muted text-center mb-8">Sign in to continue your trace.</p>

          <form action={action} className="flex flex-col gap-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Email</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none z-10" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <input id="email" name="email" type="email" required placeholder="you@example.com"
                  className="ssInput" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-semibold text-text-muted uppercase tracking-wider">Password</label>
                <Link href="/forgot-password" className="text-xs text-[var(--color-accent-purple)] hover:text-text-primary transition-colors font-medium">Forgot password?</Link>
              </div>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none z-10" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input id="password" name="password" type="password" required placeholder="••••••••"
                  className="ssInput" />
              </div>
            </div>

            {state?.error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-[var(--radius-md)]">{state.error}</p>
            )}

            <button type="submit" disabled={isPending} className={`btnPrimaryLg justify-center mt-2 w-full py-4 text-[15px] disabled:opacity-50`}>
              {isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-7">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[var(--color-accent-purple)] hover:text-text-primary transition-colors font-medium">Create one</Link>
        </p>
      </div>
    </div>
  )
}
