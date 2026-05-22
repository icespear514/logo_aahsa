'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-aahsa-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-aahsa-ochre text-xs font-semibold tracking-wide uppercase mb-1">
            National Aboriginal Head Start Association of Canada
          </p>
          <h1 className="font-heading text-2xl font-bold text-aahsa-navy">
            Contest Management
          </h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-aahsa-warmGray p-8">
          <h2 className="font-heading text-lg font-semibold text-aahsa-navy mb-6">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-aahsa-navy mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-aahsa-warmGray px-3 py-2 text-sm focus:border-aahsa-ochre focus:outline-none focus:ring-2 focus:ring-aahsa-ochre/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-aahsa-navy mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-aahsa-warmGray px-3 py-2 text-sm focus:border-aahsa-ochre focus:outline-none focus:ring-2 focus:ring-aahsa-ochre/20"
              />
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="secondary"
              loading={loading}
              className="w-full"
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
