import type { Role } from '@/lib/types'

export function isMaster(role: string | null | undefined): boolean {
  return role === 'master'
}

export function isVoter(role: string | null | undefined): boolean {
  return role === 'voter' || role === 'master'
}

export function getRole(role: string | null | undefined): Role | null {
  if (role === 'master' || role === 'voter') return role
  return null
}
