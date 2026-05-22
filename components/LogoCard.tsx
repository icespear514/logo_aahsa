'use client'

import type { Submission } from '@/lib/types'

type Props = {
  submission: Submission
  isSelected: boolean
  canSelect: boolean
  onToggle: (id: string) => void
  disabled?: boolean
}

export function LogoCard({
  submission,
  isSelected,
  canSelect,
  onToggle,
  disabled = false,
}: Props) {
  const canToggle = !disabled && (isSelected || canSelect)

  return (
    <div
      onClick={() => canToggle && onToggle(submission.id)}
      className={`relative rounded-xl border-2 bg-white shadow-sm transition-all ${
        isSelected
          ? 'border-aahsa-ochre shadow-md ring-2 ring-aahsa-ochre/20'
          : canToggle
          ? 'border-aahsa-warmGray cursor-pointer hover:border-aahsa-teal hover:shadow-md'
          : 'border-aahsa-warmGray opacity-60 cursor-not-allowed'
      }`}
    >
      {/* Star indicator */}
      <div className="absolute top-2 right-2 z-10">
        <span
          className={`text-xl ${
            isSelected ? 'text-aahsa-ochre' : 'text-gray-300'
          }`}
          aria-label={isSelected ? 'Favourited' : 'Not favourited'}
        >
          ★
        </span>
      </div>

      {/* Image */}
      <div className="aspect-square overflow-hidden rounded-t-xl bg-aahsa-cream flex items-center justify-center p-4">
        <img
          src={submission.public_url}
          alt={`Logo by ${submission.email}`}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      {/* Info */}
      <div className="p-3">
        <p
          className="text-xs text-gray-600 truncate"
          title={submission.email}
        >
          {submission.email}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date(submission.submitted_at).toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>
    </div>
  )
}
