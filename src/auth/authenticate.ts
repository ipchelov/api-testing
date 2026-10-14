import type { FastifyInstance } from 'fastify'
import { authConfig } from '../config/auth.config'
import { findUserById } from '../fake-db/users'
import type { User, UserRole } from '../fake-db/users'

export const unauthorizedResponse = {
  error: 'Unauthorized',
  message: 'Missing or invalid authentication token',
}

type AuthenticationResult = {
  user: User
  tokenRole: UserRole
}

type AuthClaims = {
  sub: string
  role: UserRole
}

function hasAuthClaims(payload: unknown): payload is AuthClaims {
  if (typeof payload !== 'object' || payload === null) {
    return false
  }

  if (!('sub' in payload) || typeof payload.sub !== 'string') {
    return false
  }

  if (!('role' in payload)) {
    return false
  }

  return payload.role === 'admin' || payload.role === 'viewer'
}

export function authenticateRequest(
  app: FastifyInstance,
  authorization: string | undefined
): AuthenticationResult | null {
  if (!authorization) {
    return null
  }

  const parts = authorization.split(' ')

  if (parts.length !== 2 || parts[0] !== authConfig.tokenType || !parts[1]) {
    return null
  }

  let decoded: unknown

  try {
    decoded = app.jwt.verify(parts[1])
  } catch {
    return null
  }

  if (!hasAuthClaims(decoded)) {
    return null
  }

  const user = findUserById(decoded.sub)

  return user ? { user, tokenRole: decoded.role } : null
}
