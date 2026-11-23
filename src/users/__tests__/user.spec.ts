import { describe, expect, it } from 'vitest'
import { normalizeEmail, toPublicUser } from '../user'
import type { User } from '../user'

describe('user helpers', () => {
  it.each(['admin@example.com', 'Admin@example.com', '  admin@example.com  '])(
    'normalizes email %s',
    (email) => {
      expect(normalizeEmail(email)).toBe('admin@example.com')
    }
  )

  it('returns only public user fields', () => {
    const user: User = {
      id: 'user_1',
      email: 'admin@example.com',
      name: 'Admin',
      role: 'admin',
      passwordHash: 'non-sensitive-test-hash',
    }
    expect(toPublicUser(user)).toEqual({
      id: 'user_1',
      email: 'admin@example.com',
      name: 'Admin',
      role: 'admin',
    })
  })
})
