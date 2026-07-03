'use client'

import { useActionState } from 'react'
import { signup } from '@/app/actions/auth'
import Link from 'next/link'

export default function SignupPage() {
  const [state, action, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      return await signup(formData)
    },
    null
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-[#f0f0f0] p-4">
      <div className="w-full max-w-md bg-[#111111] p-8 rounded-2xl border border-[#222]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium tracking-tight">Create your Clone</h1>
          <p className="text-[#888] mt-2 text-sm">Join Shadow Shelf</p>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#888] font-medium mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-[#f0f0f0] focus:outline-none focus:border-white transition-colors"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#888] font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-[#f0f0f0] focus:outline-none focus:border-white transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#888] font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-[#f0f0f0] focus:outline-none focus:border-white transition-colors"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <div className="p-3 bg-red-950/50 border border-red-900 rounded-lg text-red-200 text-sm">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-white text-black font-medium rounded-lg px-4 py-3 hover:bg-[#e0e0e0] transition-colors disabled:opacity-50"
          >
            {isPending ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[#888]">
          Already have an account?{' '}
          <Link href="/login" className="text-white hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
