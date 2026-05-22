import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Middleware handles redirect if not authenticated — user may be null on login page
  if (!user) return <>{children}</>

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isMasterUser = profile?.role === 'master'

  return (
    <div className="min-h-screen bg-aahsa-cream">
      <nav className="bg-aahsa-navy border-b border-aahsa-teal/30">
        <div className="mx-auto max-w-7xl px-4 py-0 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="font-heading text-white font-bold text-base">
              AAHSA Contest
            </span>
            <Link
              href="/admin/dashboard"
              className="text-sm text-aahsa-cream/80 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/results"
              className="text-sm text-aahsa-cream/80 hover:text-white transition-colors"
            >
              Results
            </Link>
            {isMasterUser && (
              <>
                <Link
                  href="/admin/settings"
                  className="text-sm text-aahsa-cream/80 hover:text-white transition-colors"
                >
                  Settings
                </Link>
                <Link
                  href="/admin/invite"
                  className="text-sm text-aahsa-cream/80 hover:text-white transition-colors"
                >
                  Invite
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-aahsa-cream/60">{user.email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-xs text-aahsa-cream/80 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  )
}
