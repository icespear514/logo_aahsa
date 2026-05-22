'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendConfirmationEmail } from '@/lib/email'
import { isMaster } from '@/lib/roles'

// ─── Auth ─────────────────────────────────────

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

// ─── Submissions ──────────────────────────────

export async function createSubmission(data: {
  submission_id: string
  email: string
  filename: string
  storage_path: string
  public_url: string
}) {
  const service = createServiceClient()

  const { error } = await service.from('submissions').insert({
    id: data.submission_id,
    email: data.email,
    filename: data.filename,
    storage_path: data.storage_path,
    public_url: data.public_url,
  })

  if (error) return { error: error.message }

  // Fire confirmation email — don't block on it
  sendConfirmationEmail({
    to: data.email,
    filename: data.filename,
    submittedAt: new Date().toISOString(),
  }).catch((err) => console.error('[createSubmission] email failed:', err))

  return { success: true }
}

// ─── Votes ────────────────────────────────────

export async function saveVotes(submissionIds: string[]) {
  if (submissionIds.length > 5) {
    return { error: 'You can select at most 5 favourites.' }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const service = createServiceClient()

  // Replace all votes atomically: delete then insert
  const { error: deleteError } = await service
    .from('votes')
    .delete()
    .eq('voter_id', user.id)

  if (deleteError) return { error: deleteError.message }

  if (submissionIds.length > 0) {
    const { error: insertError } = await service.from('votes').insert(
      submissionIds.map((submission_id) => ({
        voter_id: user.id,
        submission_id,
      }))
    )
    if (insertError) return { error: insertError.message }
  }

  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ─── Results — Declare Winner ─────────────────

async function assertMaster() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return isMaster(profile?.role) ? user : null
}

export async function declareWinner(submissionId: string) {
  const user = await assertMaster()
  if (!user) return { error: 'Unauthorized' }

  const service = createServiceClient()

  // Clear any existing winner first
  const { error: clearError } = await service
    .from('submissions')
    .update({ is_winner: false })
    .eq('is_winner', true)

  if (clearError) return { error: clearError.message }

  const { error } = await service
    .from('submissions')
    .update({ is_winner: true })
    .eq('id', submissionId)

  if (error) return { error: error.message }

  revalidatePath('/admin/results')
  return { success: true }
}

// ─── Contest Settings ─────────────────────────

export async function updateContestSettings(settings: {
  submissions_open?: boolean
  voting_open?: boolean
  winner_page_active?: boolean
}) {
  const user = await assertMaster()
  if (!user) return { error: 'Unauthorized' }

  const service = createServiceClient()
  const { error } = await service
    .from('contest_settings')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('id', 1)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/admin/settings')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ─── Voter Management ─────────────────────────

export async function inviteVoter(email: string) {
  const user = await assertMaster()
  if (!user) return { error: 'Unauthorized' }

  const service = createServiceClient()
  const { error } = await service.auth.admin.inviteUserByEmail(email)

  if (error) return { error: error.message }

  revalidatePath('/admin/settings')
  return { success: true }
}

export async function removeVoter(profileId: string) {
  const user = await assertMaster()
  if (!user) return { error: 'Unauthorized' }

  const service = createServiceClient()
  const { error } = await service.auth.admin.deleteUser(profileId)

  if (error) return { error: error.message }

  revalidatePath('/admin/settings')
  return { success: true }
}
