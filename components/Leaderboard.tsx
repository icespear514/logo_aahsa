'use client'

import { useState, useTransition } from 'react'
import { declareWinner } from '@/app/actions'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { SubmissionWithVotes } from '@/lib/types'

type Props = {
  results: SubmissionWithVotes[]
  isMaster: boolean
}

export function Leaderboard({ results, isMaster }: Props) {
  const [isPending, startTransition] = useTransition()
  const [declaringId, setDeclaringId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const maxVotes = results[0]?.votes ?? 0

  function handleDeclare(id: string) {
    setError(null)
    setDeclaringId(id)
    startTransition(async () => {
      const result = await declareWinner(id)
      if (result?.error) setError(result.error)
      setDeclaringId(null)
    })
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700 border border-red-200">
          {error}
        </p>
      )}
      {results.map((item, index) => (
        <div
          key={item.id}
          className={`flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm ${
            item.is_winner ? 'border-aahsa-ochre ring-2 ring-aahsa-ochre/20' : 'border-aahsa-warmGray'
          }`}
        >
          {/* Rank */}
          <div className="w-8 text-center font-heading text-lg font-bold text-aahsa-navy">
            {index + 1}
          </div>

          {/* Thumbnail */}
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-aahsa-cream flex items-center justify-center">
            <img
              src={item.public_url}
              alt={`Submission by ${item.email}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-aahsa-navy truncate">
              {item.email}
            </p>
            <div className="mt-1 flex items-center gap-2">
              {item.is_winner && <Badge variant="winner">Winner</Badge>}
              <p className="text-xs text-gray-400">
                {new Date(item.submitted_at).toLocaleDateString('en-CA')}
              </p>
            </div>
            {/* Vote bar */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-aahsa-warmGray overflow-hidden">
                <div
                  className="h-full rounded-full bg-aahsa-teal transition-all"
                  style={{
                    width: maxVotes > 0 ? `${(item.votes / maxVotes) * 100}%` : '0%',
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-aahsa-navy w-16 text-right">
                {item.votes} vote{item.votes !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Declare winner button (master only) */}
          {isMaster && !item.is_winner && (
            <Button
              variant="ghost"
              onClick={() => handleDeclare(item.id)}
              loading={isPending && declaringId === item.id}
              disabled={isPending}
              className="flex-shrink-0 text-xs"
            >
              Declare Winner
            </Button>
          )}
        </div>
      ))}

      {results.length === 0 && (
        <p className="py-16 text-center text-gray-400 text-sm">
          No votes have been cast yet.
        </p>
      )}
    </div>
  )
}
