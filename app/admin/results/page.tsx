import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isMaster } from '@/lib/roles'
import { Leaderboard } from '@/components/Leaderboard'
import type { SubmissionWithVotes } from '@/lib/types'

export default async function ResultsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const masterUser = isMaster(profile?.role)

  const { data: settings } = await service
    .from('contest_settings')
    .select('voting_open')
    .eq('id', 1)
    .single()

  // Voters can only see results after voting closes; masters always can
  if (!masterUser && settings?.voting_open !== false) {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-aahsa-navy mb-4">
          Results
        </h1>
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
          Results will be available once voting has closed.
        </div>
      </div>
    )
  }

  const [submissionsResult, votesResult] = await Promise.all([
    service.from('submissions').select('*'),
    service.from('votes').select('submission_id'),
  ])

  const submissions = submissionsResult.data ?? []
  const votes = votesResult.data ?? []

  const voteCounts = votes.reduce<Record<string, number>>((acc, v) => {
    acc[v.submission_id] = (acc[v.submission_id] ?? 0) + 1
    return acc
  }, {})

  const results: SubmissionWithVotes[] = submissions
    .map((s) => ({ ...s, votes: voteCounts[s.id] ?? 0 }))
    .sort((a, b) => b.votes - a.votes)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-aahsa-navy">
            Results
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {submissions.length} submissions · {votes.length} total votes cast
          </p>
        </div>
        {!settings?.voting_open && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            Voting closed
          </span>
        )}
      </div>

      <Leaderboard results={results} isMaster={masterUser} />
    </div>
  )
}
