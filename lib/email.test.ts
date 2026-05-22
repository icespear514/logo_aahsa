import { describe, it, expect } from 'vitest'
import { buildConfirmationEmail } from './email'

const sample = {
  to: 'artist@example.com',
  filename: 'my-logo-design.png',
  submittedAt: '2026-05-21T14:00:00Z',
}

describe('buildConfirmationEmail', () => {
  it('includes filename in plain text body', () => {
    const { text } = buildConfirmationEmail(sample)
    expect(text).toContain('my-logo-design.png')
  })

  it('includes filename in HTML body', () => {
    const { html } = buildConfirmationEmail(sample)
    expect(html).toContain('my-logo-design.png')
  })

  it('includes the contest name in plain text', () => {
    const { text } = buildConfirmationEmail(sample)
    expect(text).toContain('National Aboriginal Head Start Logo Contest')
  })

  it('returns non-empty subject', () => {
    const { subject } = buildConfirmationEmail(sample)
    expect(subject.length).toBeGreaterThan(0)
  })

  it('HTML contains AAHSA sign-off', () => {
    const { html } = buildConfirmationEmail(sample)
    expect(html).toContain('AAHSA Team')
  })
})
