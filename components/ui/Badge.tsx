type Variant = 'master' | 'voter' | 'open' | 'closed' | 'winner'

const variantClasses: Record<Variant, string> = {
  master: 'bg-aahsa-ochre text-white',
  voter: 'bg-aahsa-teal text-white',
  open: 'bg-green-100 text-green-800',
  closed: 'bg-red-100 text-red-800',
  winner: 'bg-yellow-100 text-yellow-800',
}

export function Badge({
  variant,
  children,
}: {
  variant: Variant
  children: React.ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  )
}
