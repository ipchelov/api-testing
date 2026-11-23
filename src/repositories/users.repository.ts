import type { Pool } from 'pg'
import { normalizeEmail } from '../users/user'
import type { PublicUser, User, UserRole } from '../users/user'

type UserRow = {
  id: string
  email: string
  name: string
  role: UserRole
  password_hash: string
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    passwordHash: row.password_hash,
  }
}

export function createUsersRepository(pool: Pool) {
  return {
    async findByEmail(email: string): Promise<User | undefined> {
      const result = await pool.query<UserRow>(
        'SELECT id, email, name, role, password_hash FROM public.users WHERE email = $1',
        [normalizeEmail(email)]
      )
      return result.rows[0] ? toUser(result.rows[0]) : undefined
    },

    async findById(id: string): Promise<User | undefined> {
      const result = await pool.query<UserRow>(
        'SELECT id, email, name, role, password_hash FROM public.users WHERE id = $1',
        [id]
      )
      return result.rows[0] ? toUser(result.rows[0]) : undefined
    },

    async listPublicUsers(): Promise<PublicUser[]> {
      const result = await pool.query<PublicUser>(
        'SELECT id, email, name, role FROM public.users ORDER BY id'
      )
      return result.rows
    },
  }
}

export type UsersRepository = ReturnType<typeof createUsersRepository>
