import type { FastifyInstance } from 'fastify'
import { authenticateRequest, unauthorizedResponse } from '../auth/authenticate'
import type { UsersRepository } from '../repositories/users.repository'

export function registerAdminRoute(app: FastifyInstance, usersRepository: UsersRepository) {
  app.get('/admin/users', async (request, reply) => {
    const authResult = await authenticateRequest(
      app,
      request.headers.authorization,
      usersRepository
    )

    if (authResult === null) {
      return reply.code(401).send(unauthorizedResponse)
    }

    if (authResult.tokenRole !== 'admin') {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      })
    }

    return reply.code(200).send(await usersRepository.listPublicUsers())
  })
}
