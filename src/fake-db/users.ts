export type UserRole = 'admin' | 'viewer'

export type User = {
  id: string
  email: string
  name: string
  password: string
  role: UserRole
}

export type PublicUser = Omit<User, 'password'>

const admin: User = {
  id: 'user_1',
  email: 'admin@example.com',
  name: 'Admin',
  password: 'Password123!1',
  role: 'admin',
}

const viewer: User = {
  id: 'user_2',
  email: 'viewer@example.com',
  name: 'Viewer',
  password: 'Password123!2',
  role: 'viewer',
}

const users: User[] = [admin, viewer]

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function findUserByEmail(email: string): User | undefined {
  const normalizedEmail = normalizeEmail(email)

  return users.find((user) => normalizeEmail(user.email) === normalizedEmail)
}

export function findUserById(id: string): User | undefined {
  return users.find((user) => user.id === id)
}

export function toPublicUser(user: User): PublicUser {
  const { password, ...publicUser } = user

  return publicUser
}
