'use client'

import { useActionState } from 'react'
import { signup } from '@/app/actions/auth'
import Link from 'next/link'

export default function SignupPage() {
  const [state, action, isPending] = useActionState(
    async (_prevState: any, formData: FormData) => {
      const result = await signup(formData)
      return result || { error: '' }
    },
    { error: '' }
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="light-fx" aria-hidden="true">
        <div className="ray-source" />
        <div className="rays" />
      </div>

      <div className="w-full max-w-[400px] relative z-10">
        <div className="flex items-center justify-center gap-2.5 mb-12">
          <span className="brand-orb w-7 h-7 shrink-0" />
          <span className="font-bold text-lg tracking-tight">Shadow Shelf</span>
        </div>

        <div className="ss-card p-9 sm:p-10 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65),0_0_0_1px_rgba(131,40,249,0.08)]">
          <h1 className="text-2xl font-bold text-center mb-1.5">Create your clone</h1>
          <p className="text-sm text-text-muted text-center mb-8">Your first entry takes about four minutes.</p>

          <form action={action} className="flex flex-col gap-5">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Name</label>
              <div className="glow-field-wrap">
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input id="name" name="name" type="text" required placeholder="Your full name"
                    className="w-full pl-12 pr-4 py-3.5 bg-surface border border-border rounded-[var(--radius-md)] text-text-primary text-[15px] focus:outline-none placeholder:text-text-faint" />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Email</label>
              <div className="glow-field-wrap">
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  <input id="email" name="email" type="email" required placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-surface border border-border rounded-[var(--radius-md)] text-text-primary text-[15px] focus:outline-none placeholder:text-text-faint" />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Password</label>
              <div className="glow-field-wrap">
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input id="password" name="password" type="password" required minLength={8} placeholder="At least 8 characters"
                    className="w-full pl-12 pr-4 py-3.5 bg-surface border border-border rounded-[var(--radius-md)] text-text-primary text-[15px] focus:outline-none placeholder:text-text-faint" />
                </div>
              </div>
            </div>

            {state?.error && (
              <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/40 px-3 py-2 rounded-[var(--radius-md)]">{state.error}</p>
            )}

            <button type="submit" disabled={isPending} className="btn-primary-lg justify-center mt-2 w-full py-4 text-[15px] disabled:opacity-50">
              {isPending ? 'Creating…' : 'Create your clone →'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-7">
          Already have an account?{' '}
          <Link href="/login" className="text-accent-light hover:text-text-primary transition-colors font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
