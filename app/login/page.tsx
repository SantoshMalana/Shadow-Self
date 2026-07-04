'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import Link from 'next/link'

export default function LoginPage() {
  const [state, action, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await login(prevState, formData)
      return result
    },
    { error: '' }
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {/* Light rays */}
      <div className="light-fx" aria-hidden="true">
        <div className="ray-source" />
        <div className="rays" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <span className="w-6 h-6 rounded-full shrink-0" style={{ background: 'radial-gradient(circle at 32% 28%, #ffffff, #c084fc 35%, #8328f9 78%)' }} />
          <span className="font-bold text-base tracking-tight">Shadow Shelf</span>
        </div>

        <div className="ss-card p-8">
          <h1 className="text-xl font-bold text-center mb-1.5">Welcome back</h1>
          <p className="text-sm text-text-muted text-center mb-7">Sign in to continue your trace.</p>

          <form action={action} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-bg border border-border rounded-[var(--radius-md)] text-text-primary text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-text-faint"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-bg border border-border rounded-[var(--radius-md)] text-text-primary text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-text-faint"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/40 px-3 py-2 rounded-[var(--radius-md)]">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary-lg justify-center mt-2 w-full disabled:opacity-50"
            >
              {isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-accent-light hover:text-text-primary transition-colors font-medium">Create one</Link>
        </p>
      </div>
    </div>
  )
}
