'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import Link from 'next/link'

export default function LoginPage() {
  const [state, action, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      return await login(formData)
    },
    null
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-text-primary p-4 selection:bg-accent-cold selection:text-white">
      <div className="w-full max-w-md bg-surface p-10 border border-[#2A2630] rounded-sm dynamic-shadow">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl mb-2 text-text-primary">Sign In</h1>
          <p className="font-sans text-text-muted text-sm">Access your cognitive trace</p>
        </div>

        <form action={action} className="space-y-6">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-accent-cold mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full bg-bg border border-[#2A2630] rounded-sm px-4 py-3 text-text-primary focus:outline-none focus:border-accent-brass transition-colors placeholder:text-text-muted/50 font-sans text-sm"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-accent-cold mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full bg-bg border border-[#2A2630] rounded-sm px-4 py-3 text-text-primary focus:outline-none focus:border-accent-brass transition-colors placeholder:text-text-muted/50 font-sans text-sm"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-sm text-red-400 text-sm font-sans">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-accent-brass text-[#17161B] font-sans font-medium text-sm px-4 py-3 hover:bg-[#A99360] transition-colors disabled:opacity-50 mt-4 active:scale-[0.98]"
          >
            {isPending ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-sans text-text-muted">
          New here?{' '}
          <Link href="/signup" className="text-text-primary hover:text-accent-brass transition-colors">
            Initialize profile
          </Link>
        </div>
      </div>
    </div>
  )
}
