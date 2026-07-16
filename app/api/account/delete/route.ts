import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDbUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE() {
  try {
    const user = await getDbUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = user.id

    // All-or-nothing: if any step fails, everything rolls back instead of
    // leaving the account half-deleted.
    await prisma.$transaction([
      // Dependent tables first (to satisfy FK constraints)
      prisma.feedback.deleteMany({ where: { userId } }),
      prisma.consentLedger.deleteMany({ where: { userId } }),
      prisma.$executeRaw`DELETE FROM memories WHERE user_id = ${userId}::uuid`,
      prisma.message.deleteMany({ where: { userId } }),
      prisma.chatSession.deleteMany({ where: { userId } }),
      prisma.personalityProfile.deleteMany({ where: { userId } }),
      prisma.pipelineAuditLog.deleteMany({ where: { userId } }),
      prisma.scoutDelivery.deleteMany({ where: { userId } }),
      prisma.queuedFrictionEvent.deleteMany({ where: { userId } }),
      prisma.scoutTrustLedger.deleteMany({ where: { userId } }),
      prisma.personalBaseline.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ])

    const supabase = await createClient()
    await supabase.auth.signOut()

    // Actually remove the auth record — signOut() alone does not do this.
    const adminClient = createAdminClient()
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error('App data deleted, but auth record deletion failed:', authDeleteError)
      return NextResponse.json({
        success: true,
        warning: 'All app data was deleted, but the account record itself could not be removed automatically. Manual follow-up required.',
        deletedUserId: userId,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'All data permanently deleted, including your account.',
      deletedUserId: userId,
    })
  } catch (error: any) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
