'use server'

import { getDbUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Fetches the current authenticated user's state (name, depth, days).
 */
export async function getUserState() {
  try {
    const user = await getDbUser(true) // will throw redirect to /login if not authenticated
    if (!user) throw new Error('Unauthorized')

    return {
      id: user.id,
      name: user.name,
      depthRung: user.depthRung,
      daysKnown: user.daysKnown,
    }
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') throw error
    console.error("[getUserState] Error:", error.message || error)
    return { error: error.message || 'Server Action Failed' }
  }
}

/**
 * Updates the current user's name (used by the Name Gate).
 */
export async function updateUserName(name: string) {
  try {
    const user = await getDbUser(true)
    if (!user) throw new Error('Unauthorized')

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name: name.trim() }
    })

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      depthRung: updatedUser.depthRung,
      daysKnown: updatedUser.daysKnown,
    }
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') throw error
    console.error("[updateUserName] Error:", error.message || error)
    return { error: error.message || 'Failed to update name' }
  }
}
