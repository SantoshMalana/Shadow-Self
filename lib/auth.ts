import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

/**
 * Gets the current Supabase authenticated user.
 * If requireAuth is true, redirects to /login if not authenticated.
 */
export async function getAuthUser(requireAuth = false) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    if (requireAuth) redirect('/login')
    return null
  }

  return user
}

/**
 * Gets the current User from the database.
 * If the user exists in Supabase but not in the DB, creates the DB row.
 * This ensures the app's User table stays in sync with Supabase Auth.
 */
export async function getDbUser(requireAuth = false) {
  const authUser = await getAuthUser(requireAuth)
  if (!authUser) return null

  // Check if user exists in our DB
  let dbUser = await prisma.user.findUnique({
    where: { id: authUser.id }
  })

  // If not, this is their first login after signup. Create the DB row.
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || null,
        depthRung: 1,
        daysKnown: 0,
      }
    })
  }

  return dbUser
}
