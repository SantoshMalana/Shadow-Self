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
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-200 p-4">
      <div className="w-full max-w-md bg-neutral-900 p-8 rounded-2xl border border-neutral-800">
        <div className="text-center mb-8">
          <div className="text-3xl mb-3 opacity-40">◈</div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-100">Create your Clone</h1>
          <p className="text-neutral-500 mt-2 text-sm">Join Shadow Shelf</p>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-medium mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full bg-neutral-800/50 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-700 transition-all placeholder:text-neutral-600"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full bg-neutral-800/50 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-700 transition-all placeholder:text-neutral-600"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              className="w-full bg-neutral-800/50 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-700 transition-all placeholder:text-neutral-600"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <div className="p-3 bg-red-950/50 border border-red-900 rounded-lg text-red-300 text-sm">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-neutral-100 text-neutral-950 font-medium rounded-xl px-4 py-3 hover:bg-white transition-colors disabled:opacity-50"
          >
            {isPending ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{' '}
          <Link href="/login" className="text-neutral-200 hover:text-white hover:underline transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
