import { createServiceClient } from '@/lib/supabase/service'

export const revalidate = 60

export default async function WinnerPage() {
  const service = createServiceClient()

  const { data: settings } = await service
    .from('contest_settings')
    .select('winner_page_active')
    .eq('id', 1)
    .single()

  if (!settings?.winner_page_active) {
    return (
      <div className="min-h-screen bg-aahsa-cream">
        <header className="bg-aahsa-navy py-6 px-4 shadow-md">
          <div className="mx-auto max-w-3xl">
            <p className="text-aahsa-ochre text-sm font-semibold tracking-wide uppercase">
              Alberta Aboriginal Head Start Association
            </p>
            <h1 className="font-heading text-2xl font-bold text-white">
              National Aboriginal Head Start — Logo Contest
            </h1>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="rounded-xl bg-white shadow-sm border border-aahsa-warmGray p-10">
            <h2 className="font-heading text-2xl font-bold text-aahsa-navy mb-4">
              Check Back Soon
            </h2>
            <p className="text-gray-600 leading-relaxed">
              The Logo Contest is still ongoing. Our team is reviewing all
              submissions and will announce the winner soon.
            </p>
          </div>
        </main>
      </div>
    )
  }

  const { data: winner } = await service
    .from('submissions')
    .select('*')
    .eq('is_winner', true)
    .single()

  const firstName = winner?.email?.split('@')[0]?.split('.')?.[0] ?? null
  const displayName =
    firstName
      ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
      : winner?.email ?? 'our winner'

  return (
    <div className="min-h-screen bg-aahsa-cream">
      <header className="bg-aahsa-navy py-6 px-4 shadow-md">
        <div className="mx-auto max-w-3xl">
          <p className="text-aahsa-ochre text-sm font-semibold tracking-wide uppercase">
            Alberta Aboriginal Head Start Association
          </p>
          <h1 className="font-heading text-2xl font-bold text-white">
            National Aboriginal Head Start — Logo Contest
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="rounded-xl bg-white shadow-sm border border-aahsa-warmGray overflow-hidden">
          <div className="bg-aahsa-navy px-8 py-6">
            <p className="text-aahsa-ochre font-semibold tracking-wide uppercase text-sm mb-1">
              And the winner is…
            </p>
            <h2 className="font-heading text-3xl font-bold text-white">
              Congratulations, {displayName}!
            </h2>
          </div>

          {winner && (
            <div className="p-8">
              <div className="mb-8 flex justify-center">
                <img
                  src={winner.public_url}
                  alt="Winning logo design"
                  className="max-h-80 max-w-full rounded-lg shadow-lg object-contain"
                />
              </div>
              <p className="text-gray-600 leading-relaxed text-lg">
                We are thrilled to announce that the new AAHSA national
                program logo has been selected. Thank you to everyone who
                submitted their artwork — your creativity and spirit made
                this contest truly special.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
