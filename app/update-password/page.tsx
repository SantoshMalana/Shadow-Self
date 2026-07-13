'use client'

import { useActionState, useEffect, useState } from 'react'
import { updatePassword } from '@/app/actions/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [sessionChecked, setSessionChecked] = useState(false)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setHasSession(!!session)
      setSessionChecked(true)
    }
    checkSession()
  }, [])

  const [state, action, isPending] = useActionState(
    async (_prevState: any, formData: FormData) => {
      const result = await updatePassword(formData)
      return result || { error: '' }
    },
    { error: '', success: '' }
  )

  if (!sessionChecked) return null

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-bg text-text-primary">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-3">Invalid or expired link</h2>
          <p className="text-text-muted mb-6">Please request a new password reset link.</p>
          <Link href="/forgot-password" className="btnPrimaryLg">Request New Link</Link>
        </div>
      </div>
    )
  }

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
          <h1 className="text-2xl font-bold text-center mb-1.5">Update password</h1>
          <p className="text-sm text-text-muted text-center mb-8">Enter your new password below.</p>

          <form action={action} className="flex flex-col gap-5">
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none z-10" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input id="password" name="password" type="password" required minLength={8} placeholder="At least 8 characters"
                  className="ssInput" />
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Confirm New Password</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none z-10" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} placeholder="Confirm your password"
                  className="ssInput" />
              </div>
            </div>

            {state?.error && (
              <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/40 px-3 py-2 rounded-[var(--radius-md)]">{state.error}</p>
            )}

            <button type="submit" disabled={isPending} className={`btnPrimaryLg justify-center mt-2 w-full py-4 text-[15px] disabled:opacity-50`}>
              {isPending ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
