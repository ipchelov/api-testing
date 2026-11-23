import { describe, expect, it, vi } from 'vitest'
import { buildApp } from '../../src/app'
import { getDatabaseUrl } from '../../src/config/database.config'
import { createDatabasePool, withDatabaseTransaction } from '../../src/db/database'
import { migrate } from '../../src/db/migrate'
import { createSeedUsers, seedUsers } from '../../src/db/seed'
import { createUsersRepository } from '../../src/repositories/users.repository'
import { useTestDatabase } from '../helpers/database'

describe('PostgreSQL users repository', () => {
  const database = useTestDatabase()

  it.each(['admin@example.com', 'Admin@example.com', '  admin@example.com  '])(
    'finds a user by normalized email %s',
    async (email) => {
      const user = await createUsersRepository(database.pool).findByEmail(email)
      expect(user).toMatchObject({ id: 'user_1', email: 'admin@example.com', role: 'admin' })
      expect(user?.passwordHash).toMatch(/^scrypt-v1\$/)
      expect(user).not.toHaveProperty('password')
    }
  )

  it('finds users by id and returns undefined for unknown or SQL-like input', async () => {
    const repository = createUsersRepository(database.pool)
    expect(await repository.findById('user_1')).toMatchObject({ name: 'Admin' })
    expect(await repository.findById('unknown_user')).toBeUndefined()
    expect(await repository.findByEmail('unknown@example.com')).toBeUndefined()
    expect(await repository.findByEmail("' OR 1=1 --")).toBeUndefined()
  })

  it('returns an ordered public user list without hashes', async () => {
    expect(await createUsersRepository(database.pool).listPublicUsers()).toEqual([
      { id: 'user_1', email: 'admin@example.com', name: 'Admin', role: 'admin' },
      { id: 'user_2', email: 'viewer@example.com', name: 'Viewer', role: 'viewer' },
    ])
  })

  it.each([
    { label: 'duplicate id', id: 'user_1', code: '23505' },
    { label: 'duplicate email', email: 'admin@example.com', code: '23505' },
    { label: 'unnormalized email', email: 'Third@example.com', code: '23514' },
    { label: 'unsupported role', role: 'owner', code: '23514' },
    { label: 'empty name', name: ' ', code: '23514' },
    { label: 'missing hash', passwordHash: null, code: '23502' },
  ])('enforces SQL constraint: $label', async (invalid) => {
    const row = {
      id: 'user_3',
      email: 'third@example.com',
      name: 'Third',
      role: 'viewer',
      passwordHash: 'non-sensitive-test-hash',
      ...invalid,
    }

    await expect(
      withDatabaseTransaction(database.pool, 'api_testing_test', async (client) => {
        await client.query(
          `INSERT INTO public.users (id, email, name, role, password_hash)
           VALUES ($1, $2, $3, $4, $5)`,
          [row.id, row.email, row.name, row.role, row.passwordHash]
        )
      })
    ).rejects.toMatchObject({ code: invalid.code })
  })

  it('can repeat migrations and seed without replacing existing users', async () => {
    const repository = createUsersRepository(database.pool)
    const before = await repository.findById('user_1')
    await migrate(database.pool, 'api_testing_test')
    await seedUsers(
      database.pool,
      await createSeedUsers('different-test-password', 'different-viewer-password'),
      'api_testing_test'
    )
    expect(await repository.findById('user_1')).toEqual(before)
    expect(await repository.listPublicUsers()).toHaveLength(2)
  })

  it('stops before running a write when the actual database does not match', async () => {
    const operation = vi.fn(async () => {})
    await expect(withDatabaseTransaction(database.pool, 'api_testing', operation)).rejects.toThrow(
      'Refusing database changes'
    )
    expect(operation).not.toHaveBeenCalled()
  })

  it('returns a safe 500 for a repository error and closes the app pool', async () => {
    const pool = createDatabasePool(getDatabaseUrl('api_testing_test'))
    const app = buildApp({ pool })
    const closePool = vi.spyOn(pool, 'end')
    try {
      await app.ready()
      const accessToken = app.jwt.sign({ role: 'admin' }, { sub: 'user_1' })
      const query = vi.spyOn(pool, 'query').mockImplementationOnce(() => {
        throw new Error('test database failure')
      })
      try {
        const response = await app.inject({
          method: 'GET',
          url: '/users/me',
          headers: { authorization: `Bearer ${accessToken}` },
        })
        expect(response.statusCode).toBe(500)
        expect(response.json()).toEqual({
          error: 'Internal Server Error',
          message: 'Internal server error',
        })
      } finally {
        query.mockRestore()
      }
    } finally {
      await app.close()
    }
    expect(closePool).toHaveBeenCalledOnce()
  })
})
