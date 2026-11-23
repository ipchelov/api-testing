import type { Pool, PoolClient } from 'pg'
import { hashPassword } from '../auth/password'
import type { DatabaseName } from '../config/database.config'
import type { User } from '../users/user'
import { withDatabaseTransaction } from './database'

export async function createSeedUsers(
  adminPassword: string,
  viewerPassword: string
): Promise<User[]> {
  if (!adminPassword || !viewerPassword) throw new Error('Both seed passwords are required')

  return [
    {
      id: 'user_1',
      email: 'admin@example.com',
      name: 'Admin',
      role: 'admin',
      passwordHash: await hashPassword(adminPassword),
    },
    {
      id: 'user_2',
      email: 'viewer@example.com',
      name: 'Viewer',
      role: 'viewer',
      passwordHash: await hashPassword(viewerPassword),
    },
  ]
}

export async function insertSeedUsers(client: PoolClient, users: User[]): Promise<void> {
  for (const user of users) {
    await client.query(
      `INSERT INTO public.users (id, email, name, role, password_hash)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
      [user.id, user.email, user.name, user.role, user.passwordHash]
    )
  }
}

export async function seedUsers(
  pool: Pool,
  users: User[],
  expectedDatabase: DatabaseName
): Promise<void> {
  await withDatabaseTransaction(pool, expectedDatabase, (client) => insertSeedUsers(client, users))
}
