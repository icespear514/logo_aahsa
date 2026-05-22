'use client'

import { useState, useTransition } from 'react'
import { updateContestSettings } from '@/app/actions'

type Props = {
  submissionsOpen: boolean
  votingOpen: boolean
  winnerPageActive: boolean
}

export function SettingsControls({
  submissionsOpen: initialSubmissionsOpen,
  votingOpen: initialVotingOpen,
  winnerPageActive: initialWinnerPageActive,
}: Props) {
  const [submissionsOpen, setSubmissionsOpen] = useState(initialSubmissionsOpen)
  const [votingOpen, setVotingOpen] = useState(initialVotingOpen)
  const [winnerPageActive, setWinnerPageActive] = useState(
    initialWinnerPageActive
  )
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function toggle(field: 'submissions_open' | 'voting_open' | 'winner_page_active', value: boolean) {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await updateContestSettings({ [field]: value })
      if (result?.error) {
        setError(result.error)
      } else {
        if (field === 'submissions_open') setSubmissionsOpen(value)
        if (field === 'voting_open') setVotingOpen(value)
        if (field === 'winner_page_active') setWinnerPageActive(value)
        setMessage('Settings updated.')
      }
    })
  }

  return (
    <div className="rounded-xl border border-aahsa-warmGray bg-white shadow-sm divide-y divide-aahsa-warmGray/50">
      {error && (
        <div className="px-6 py-3 bg-red-50 text-sm text-red-700">{error}</div>
      )}
      {message && (
        <div className="px-6 py-3 bg-green-50 text-sm text-green-700">
          {message}
        </div>
      )}

      {/* Submissions toggle */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="font-semibold text-aahsa-navy text-sm">Submissions</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {submissionsOpen
              ? 'Currently open — public can submit logos'
              : 'Closed — submission form is disabled'}
          </p>
        </div>
        <button
          onClick={() => toggle('submissions_open', !submissionsOpen)}
          disabled={isPending}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
            submissionsOpen ? 'bg-aahsa-teal' : 'bg-gray-200'
          }`}
          role="switch"
          aria-checked={submissionsOpen}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ease-in-out ${
              submissionsOpen ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Voting toggle */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="font-semibold text-aahsa-navy text-sm">Voting</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {votingOpen
              ? 'Currently open — voters can submit favourites'
              : 'Closed — results are now visible to all voters'}
          </p>
        </div>
        <button
          onClick={() => toggle('voting_open', !votingOpen)}
          disabled={isPending}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
            votingOpen ? 'bg-aahsa-teal' : 'bg-gray-200'
          }`}
          role="switch"
          aria-checked={votingOpen}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ease-in-out ${
              votingOpen ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Winner page toggle */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="font-semibold text-aahsa-navy text-sm">
            Public Winner Page
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {winnerPageActive
              ? 'Active — winner is publicly visible at /winner'
              : 'Hidden — /winner shows "Check back soon"'}
          </p>
        </div>
        <button
          onClick={() => toggle('winner_page_active', !winnerPageActive)}
          disabled={isPending}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
            winnerPageActive ? 'bg-aahsa-ochre' : 'bg-gray-200'
          }`}
          role="switch"
          aria-checked={winnerPageActive}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ease-in-out ${
              winnerPageActive ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
