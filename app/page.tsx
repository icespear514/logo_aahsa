import { SubmissionForm } from '@/components/SubmissionForm'

export default function SubmissionPage() {
  return (
    <div className="min-h-screen bg-aahsa-cream">
      {/* Header */}
      <header className="bg-aahsa-navy py-6 px-4 shadow-md">
        <div className="mx-auto max-w-3xl flex items-center gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-white leading-tight">
              NAHSAC
            </h1>
            <p className="text-aahsa-cream/80 text-lg font-heading">
              Logo Contest
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-xl bg-white shadow-sm border border-aahsa-warmGray overflow-hidden">
          <div className="border-b border-aahsa-warmGray bg-aahsa-cream/50 px-8 py-6">
            <h2 className="font-heading text-xl font-bold text-aahsa-navy">
              Submit Your Design
            </h2>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              We are searching for a new logo to represent our national
              program. Submit your design below for a chance to have your
              artwork chosen.
            </p>
          </div>
          <div className="px-8 py-8">
            <SubmissionForm />
          </div>
        </div>
      </main>
    </div>
  )
}
