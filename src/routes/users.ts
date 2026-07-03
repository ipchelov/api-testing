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

    const [scheme, token] = authorization.split(' ')

    if (scheme !== authConfig.tokenType || !token) {
      return reply.code(401).send(unauthorizedResponse)
    }

    try {
      const decoded = app.jwt.verify(token)

      if (!hasSubject(decoded)) {
        return reply.code(401).send(unauthorizedResponse)
      }

      const user = findUserById(decoded.sub)

      if (!user) {
        return reply.code(401).send(unauthorizedResponse)
      }

      return reply.code(200).send(toPublicUser(user))
    } catch {
      return reply.code(401).send(unauthorizedResponse)
    }
  })
}
