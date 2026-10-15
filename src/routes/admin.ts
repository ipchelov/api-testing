import type { FastifyInstance } from 'fastify'
import { authenticateRequest, unauthorizedResponse } from '../auth/authenticate'
import { listPublicUsers } from '../fake-db/users'

export function registerAdminRoute(app: FastifyInstance) {
  app.get('/admin/users', (request, reply) => {
    const authResult = authenticateRequest(app, request.headers.authorization)

    if (authResult === null) {
      return reply.code(401).send(unauthorizedResponse)
    }

    if (authResult.tokenRole !== 'admin') {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      })
    }

    return reply.code(200).send(listPublicUsers())
  })
}
