import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import type { Pool, PoolClient } from 'pg'
import { buildApp } from '../../src/app'
import { getDatabaseUrl } from '../../src/config/database.config'
import { createDatabasePool, withDatabaseTransaction } from '../../src/db/database'
import { migrate } from '../../src/db/migrate'
import { createSeedUsers, insertSeedUsers } from '../../src/db/seed'
import type { User } from '../../src/users/user'

export function buildTestApp() {
  return buildApp({ pool: createDatabasePool(getDatabaseUrl('api_testing_test')) })
}

async function clearFixtures(client: PoolClient) {
  await client.query('DELETE FROM public.projects')
  await client.query('DELETE FROM public.users')
}

export function useTestDatabase() {
  let pool: Pool
  let users: User[]
  let ready = false

  beforeAll(async () => {
    pool = createDatabasePool(getDatabaseUrl('api_testing_test'))
    pool.on('error', () => console.error('Unexpected test database pool error'))
    await migrate(pool, 'api_testing_test')
    users = await createSeedUsers('Password123!1', 'Password123!2')
    ready = true
  })

  beforeEach(async () => {
    await withDatabaseTransaction(pool, 'api_testing_test', async (client) => {
      await clearFixtures(client)
      await insertSeedUsers(client, users)
    })
  })

  afterEach(async () => {
    if (ready) await withDatabaseTransaction(pool, 'api_testing_test', clearFixtures)
  })
  afterAll(async () => {
    if (pool) await pool.end()
  })

  return {
    get pool() {
      return pool
    },
  }
}
