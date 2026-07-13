'use client'

import { useActionState } from 'react'
import { resetPassword } from '@/app/actions/auth'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [state, action, isPending] = useActionState(
    async (_prevState: any, formData: FormData) => {
      const result = await resetPassword(formData)
      return result || { error: '' }
    },
    { error: '', success: '' }
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="lightFx" aria-hidden="true">
        <div className="raySource" />
        <div className="rays" />
      </div>

      <div className="w-full max-w-[400px] relative z-10">
        <div className="flex items-center justify-center gap-2.5 mb-12">
          <span className="w-7 h-7 shrink-0 rounded-full shadow-[var(--shadow-glow-sm)]" style={{ background: 'radial-gradient(circle at 32% 28%, #ffffff, #c084fc 35%, var(--color-accent) 78%)' }} />
          <span className="font-bold text-lg tracking-tight">Shadow Shelf</span>
        </div>

        <div className="bg-card border border-border rounded-[var(--radius-lg)] p-9 sm:p-10 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65),0_0_0_1px_rgba(131,40,249,0.08)]">
          <h1 className="text-2xl font-bold text-center mb-1.5">Reset password</h1>
          <p className="text-sm text-text-muted text-center mb-8">Enter your email and we'll send you a link.</p>

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

            {state?.error && (
              <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/40 px-3 py-2 rounded-[var(--radius-md)]">{state.error}</p>
            )}

            {state?.success && (
              <p className="text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-3 py-2 rounded-[var(--radius-md)]">{state.success}</p>
            )}

            <button type="submit" disabled={isPending || !!state?.success} className={`btnPrimaryLg justify-center mt-2 w-full py-4 text-[15px] disabled:opacity-50`}>
              {isPending ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-7">
          Remember your password?{' '}
          <Link href="/login" className="text-accent-light hover:text-text-primary transition-colors font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
