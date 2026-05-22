import Link from 'next/link'

export default function SuccessPage() {
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

      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="rounded-xl bg-white shadow-sm border border-aahsa-warmGray p-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="font-heading text-2xl font-bold text-aahsa-navy mb-3">
            Thank You for Your Submission!
          </h2>
          <p className="text-gray-600 leading-relaxed mb-2">
            We have received your logo design and our team will be reviewing
            all entries.
          </p>
          <p className="text-gray-600 leading-relaxed mb-8">
            A confirmation email has been sent to your inbox. We will be in
            touch if your design is selected.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-aahsa-ochre px-6 py-2.5 text-sm font-semibold text-white hover:bg-aahsa-orange transition-colors"
          >
            Submit Another Design
          </Link>
        </div>
      </main>
    </div>
  )
}
