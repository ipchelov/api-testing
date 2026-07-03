import { describe, expect, it } from 'vitest'
import { findUserByEmail, findUserById, toPublicUser } from '../users'
import type { User } from '../users'

const admin: User = {
  id: 'user_1',
  email: 'admin@example.com',
  name: 'Admin',
  password: 'Password123!1',
  role: 'admin',
}

describe('fake-db/users', () => {
  it('finds user by exact email', () => {
    expect(findUserByEmail('admin@example.com')).toEqual(admin)
  })

  it('finds user by email with uppercase letters', () => {
    expect(findUserByEmail('Admin@example.com')).toEqual(admin)
  })

  it('finds user by email with surrounding spaces', () => {
    expect(findUserByEmail('  admin@example.com  ')).toEqual(admin)
  })

  it('returns undefined for unknown email', () => {
    expect(findUserByEmail('unknown@example.com')).toBeUndefined()
  })

  it('finds user by id', () => {
    expect(findUserById('user_1')).toEqual(admin)
  })

  it('returns undefined for unknown user id', () => {
    expect(findUserById('unknown_user')).toBeUndefined()
  })

  it('converts user to public user without password', () => {
    expect(toPublicUser(admin)).toEqual({
      id: 'user_1',
      email: 'admin@example.com',
      name: 'Admin',
      role: 'admin',
    })
  })
})
