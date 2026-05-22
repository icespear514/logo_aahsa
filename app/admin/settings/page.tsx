import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { VoterList } from '@/components/VoterList'
import { SettingsControls } from './SettingsControls'

export default async function SettingsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const service = createServiceClient()

  const [settingsResult, votersResult] = await Promise.all([
    service.from('contest_settings').select('*').eq('id', 1).single(),
    service.from('profiles').select('*').order('created_at'),
  ])

  const settings = settingsResult.data
  const voters = votersResult.data ?? []

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="font-heading text-2xl font-bold text-aahsa-navy mb-1">
          Settings
        </h1>
        <p className="text-sm text-gray-500">Master admin controls</p>
      </div>

      {/* Contest Controls */}
      <section>
        <h2 className="font-heading text-lg font-semibold text-aahsa-navy mb-4">
          Contest Controls
        </h2>
        {settings && (
          <SettingsControls
            submissionsOpen={settings.submissions_open}
            votingOpen={settings.voting_open}
            winnerPageActive={settings.winner_page_active}
          />
        )}
      </section>

      {/* Voter Management */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-semibold text-aahsa-navy">
            Voters ({voters.length})
          </h2>
          <a
            href="/admin/invite"
            className="text-sm font-semibold text-aahsa-teal hover:underline"
          >
            + Invite Voter
          </a>
        </div>
        <VoterList voters={voters} />
      </section>
    </div>
  )
}
