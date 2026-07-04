'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { checkRateLimit } from '@/lib/rate-limit'

async function getClientIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const ip = await getClientIp()
  const rate = checkRateLimit(`login:${ip}`, 10, 5 * 60_000)
  if (!rate.allowed) {
    return { error: 'Too many login attempts. Please wait a few minutes and try again.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Redirect to chat (clone) or train based on preference.
  // We'll default to /chat if they're logging in.
  redirect('/clone')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  if (!email || !password || !name) {
    return { error: 'Name, email, and password are required' }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const ip = await getClientIp()
  const rate = checkRateLimit(`signup:${ip}`, 5, 15 * 60_000)
  if (!rate.allowed) {
    return { error: 'Too many signup attempts from this network. Please try again shortly.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      }
    }
  })

  if (error) {
    return { error: error.message }
  }

  // After signup, redirect to onboarding/training
  redirect('/train')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
