'use client'

import { useState, useTransition } from 'react'
import { inviteVoter } from '@/app/actions'
import { Button } from '@/components/ui/Button'

export default function InvitePage() {
  const [email, setEmail] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const result = await inviteVoter(email)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(`Invitation sent to ${email}.`)
        setEmail('')
      }
    })
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-aahsa-navy">
          Invite Voter
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          The invited person will receive a magic-link email to set their
          password and access the voting dashboard.
        </p>
      </div>

      <div className="rounded-xl border border-aahsa-warmGray bg-white shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="invite-email"
              className="block text-sm font-semibold text-aahsa-navy mb-1"
            >
              Email address
            </label>
            <input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@aahsa.ca"
              className="w-full rounded-md border border-aahsa-warmGray px-3 py-2 text-sm focus:border-aahsa-ochre focus:outline-none focus:ring-2 focus:ring-aahsa-ochre/20"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700 border border-red-200">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-700 border border-green-200">
              {success}
            </p>
          )}

          <Button type="submit" loading={isPending} className="w-full">
            Send Invitation
          </Button>
        </form>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Invited users receive a Supabase Auth email with a link to set their
        password. Their account will be created with the <strong>voter</strong>{' '}
        role.
      </p>
    </div>
  )
}
