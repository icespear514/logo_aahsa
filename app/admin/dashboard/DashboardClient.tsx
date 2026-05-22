'use client'

import { useState, useTransition } from 'react'
import { LogoCard } from '@/components/LogoCard'
import { Button } from '@/components/ui/Button'
import { saveVotes } from '@/app/actions'
import type { Submission } from '@/lib/types'

type Props = {
  submissions: Submission[]
  initialVoteIds: string[]
  votingOpen: boolean
}

const MAX_VOTES = 5

export function DashboardClient({
  submissions,
  initialVoteIds,
  votingOpen,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialVoteIds)
  )
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (next.size >= MAX_VOTES) return prev
        next.add(id)
      }
      return next
    })
    setSaved(false)
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await saveVotes(Array.from(selected))
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  if (!votingOpen) {
    return (
      <div>
        <div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800 font-medium">
          Voting has closed. Your selections are shown below (read-only).
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {submissions.map((s) => (
            <LogoCard
              key={s.id}
              submission={s}
              isSelected={selected.has(s.id)}
              canSelect={false}
              onToggle={() => {}}
              disabled
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-aahsa-navy">
            {selected.size}
          </span>{' '}
          of {MAX_VOTES} favourites selected
        </p>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-green-600 font-medium">
              ✓ Votes saved
            </span>
          )}
          {error && (
            <span className="text-sm text-red-600">{error}</span>
          )}
          <Button
            onClick={handleSave}
            loading={isPending}
            disabled={isPending}
          >
            Save My Votes
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {submissions.map((s) => (
          <LogoCard
            key={s.id}
            submission={s}
            isSelected={selected.has(s.id)}
            canSelect={selected.size < MAX_VOTES}
            onToggle={toggle}
          />
        ))}
      </div>

      {submissions.length === 0 && (
        <p className="py-16 text-center text-gray-400 text-sm">
          No submissions yet.
        </p>
      )}
    </div>
  )
}
