import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../password'

describe('password hashing', () => {
  it('verifies the original password and rejects a different password', async () => {
    const hash = await hashPassword('test-password')
    expect(hash).not.toContain('test-password')
    expect(await verifyPassword('test-password', hash)).toBe(true)
    expect(await verifyPassword('wrong-password', hash)).toBe(false)
  })

  it('uses a different salt for each hash', async () => {
    expect(await hashPassword('test-password')).not.toBe(await hashPassword('test-password'))
  })

  it.each(['plaintext', 'scrypt-v1$bad$hash', 'scrypt-v2$bad$hash'])(
    'rejects malformed or unsupported hash %s',
    async (hash) => {
      expect(await verifyPassword('test-password', hash)).toBe(false)
    }
  )
})
