import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const service = createServiceClient()

  const [submissionsResult, votesResult, settingsResult] = await Promise.all([
    service.from('submissions').select('*').order('submitted_at', { ascending: false }),
    service.from('votes').select('submission_id').eq('voter_id', user.id),
    service.from('contest_settings').select('voting_open').eq('id', 1).single(),
  ])

  const submissions = submissionsResult.data ?? []
  const voteIds = (votesResult.data ?? []).map((v) => v.submission_id)
  const votingOpen = settingsResult.data?.voting_open ?? true

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-aahsa-navy">
          Voting Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {submissions.length} submission{submissions.length !== 1 ? 's' : ''}{' '}
          total
        </p>
      </div>

      <DashboardClient
        submissions={submissions}
        initialVoteIds={voteIds}
        votingOpen={votingOpen}
      />
    </div>
  )
}
