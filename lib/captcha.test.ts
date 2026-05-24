import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { verifyCaptcha } from './captcha'

describe('verifyCaptcha', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    process.env.TURNSTILE_SECRET_KEY = 'test-secret'
  })

  afterEach(() => {
    delete process.env.TURNSTILE_SECRET_KEY
    vi.unstubAllGlobals()
  })

  it('returns true when Cloudflare responds with success: true', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ success: true }),
    } as Response)

    const result = await verifyCaptcha('valid-token')
    expect(result).toBe(true)
  })

  it('calls the siteverify endpoint with the secret and token', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ success: true }),
    } as Response)

    await verifyCaptcha('my-token')

    expect(fetch).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ secret: 'test-secret', response: 'my-token' }),
      })
    )
  })

  it('returns false when Cloudflare responds with success: false', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
    } as Response)

    const result = await verifyCaptcha('bad-token')
    expect(result).toBe(false)
  })

  it('returns false when fetch throws a network error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network failure'))

    const result = await verifyCaptcha('any-token')
    expect(result).toBe(false)
  })

  it('throws when TURNSTILE_SECRET_KEY is not set', async () => {
    delete process.env.TURNSTILE_SECRET_KEY
    await expect(verifyCaptcha('any-token')).rejects.toThrow('TURNSTILE_SECRET_KEY is not set')
  })
})
