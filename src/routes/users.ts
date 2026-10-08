import type { FastifyInstance } from 'fastify'
import { authConfig } from '../config/auth.config'
import { findUserById, toPublicUser } from '../fake-db/users'

const unauthorizedResponse = {
  error: 'Unauthorized',
  message: 'Missing or invalid authentication token',
}

type PayloadWithSubject = {
  sub: string
}

function hasSubject(payload: unknown): payload is PayloadWithSubject {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'sub' in payload &&
    typeof payload.sub === 'string'
  )
}

export function registerUsersRoute(app: FastifyInstance) {
  app.get('/users/me', (request, reply) => {
    const authorization = request.headers.authorization

    if (!authorization) {
      return reply.code(401).send(unauthorizedResponse)
    }

    const parts = authorization.split(' ')

    if (parts.length !== 2 || parts[0] !== authConfig.tokenType || !parts[1]) {
      return reply.code(401).send(unauthorizedResponse)
    }

    const token = parts[1]
    let decoded: unknown

    try {
      decoded = app.jwt.verify(token)
    } catch {
      return reply.code(401).send(unauthorizedResponse)
    }

    if (!hasSubject(decoded)) {
      return reply.code(401).send(unauthorizedResponse)
    }

    const user = findUserById(decoded.sub)

    if (!user) {
      return reply.code(401).send(unauthorizedResponse)
    }

    return reply.code(200).send(toPublicUser(user))
  })
}
