'use client'

import { useState, useTransition } from 'react'
import { removeVoter } from '@/app/actions'
import { Badge } from '@/components/ui/Badge'
import type { Profile } from '@/lib/types'

export function VoterList({ voters }: { voters: Profile[] }) {
  const [isPending, startTransition] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleRemove(id: string) {
    if (!confirm('Remove this voter? They will no longer be able to log in.')) return
    setError(null)
    setRemovingId(id)
    startTransition(async () => {
      const result = await removeVoter(id)
      if (result?.error) setError(result.error)
      setRemovingId(null)
    })
  }

  return (
    <div>
      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700 border border-red-200">
          {error}
        </p>
      )}
      <div className="overflow-hidden rounded-xl border border-aahsa-warmGray bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-aahsa-cream border-b border-aahsa-warmGray">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-aahsa-navy">
                Email
              </th>
              <th className="px-4 py-3 text-left font-semibold text-aahsa-navy">
                Role
              </th>
              <th className="px-4 py-3 text-left font-semibold text-aahsa-navy">
                Joined
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-aahsa-warmGray/50">
            {voters.map((voter) => (
              <tr key={voter.id} className="hover:bg-aahsa-cream/30">
                <td className="px-4 py-3 text-gray-700">{voter.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={voter.role}>{voter.role}</Badge>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(voter.created_at).toLocaleDateString('en-CA')}
                </td>
                <td className="px-4 py-3 text-right">
                  {voter.role !== 'master' && (
                    <button
                      onClick={() => handleRemove(voter.id)}
                      disabled={isPending && removingId === voter.id}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {isPending && removingId === voter.id
                        ? 'Removing…'
                        : 'Remove'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {voters.length === 0 && (
          <p className="py-8 text-center text-gray-400 text-sm">
            No voters yet. Invite someone to get started.
          </p>
        )}
      </div>
    </div>
  )
}
