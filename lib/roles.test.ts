import { describe, it, expect } from 'vitest'
import { isMaster, isVoter, getRole } from './roles'

describe('isMaster', () => {
  it('returns true for master', () => expect(isMaster('master')).toBe(true))
  it('returns false for voter', () => expect(isMaster('voter')).toBe(false))
  it('returns false for null', () => expect(isMaster(null)).toBe(false))
  it('returns false for undefined', () => expect(isMaster(undefined)).toBe(false))
})

describe('isVoter', () => {
  it('returns true for voter', () => expect(isVoter('voter')).toBe(true))
  it('returns true for master (masters can also access voter areas)', () => expect(isVoter('master')).toBe(true))
  it('returns false for null', () => expect(isVoter(null)).toBe(false))
})

describe('getRole', () => {
  it('returns master for "master"', () => expect(getRole('master')).toBe('master'))
  it('returns voter for "voter"', () => expect(getRole('voter')).toBe('voter'))
  it('returns null for unknown string', () => expect(getRole('admin')).toBe(null))
  it('returns null for null', () => expect(getRole(null)).toBe(null))
  it('returns null for undefined', () => expect(getRole(undefined)).toBe(null))
})
