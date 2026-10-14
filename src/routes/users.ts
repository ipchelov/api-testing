import type { FastifyInstance } from 'fastify'
import { authenticateRequest, unauthorizedResponse } from '../auth/authenticate'
import { toPublicUser } from '../fake-db/users'

export function registerUsersRoute(app: FastifyInstance) {
  app.get('/users/me', (request, reply) => {
    const authResult = authenticateRequest(app, request.headers.authorization)

    if (authResult === null) {
      return reply.code(401).send(unauthorizedResponse)
    }

    return reply.code(200).send(toPublicUser(authResult.user))
  })
}
