export type UserRole = 'admin' | 'viewer'

export type PublicUser = {
  id: string
  email: string
  name: string
  role: UserRole
}

export type User = PublicUser & {
  passwordHash: string
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
}
