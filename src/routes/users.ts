import type { FastifyInstance } from 'fastify'
import { authenticateRequest, unauthorizedResponse } from '../auth/authenticate'
import type { UsersRepository } from '../repositories/users.repository'
import { toPublicUser } from '../users/user'

export function registerUsersRoute(app: FastifyInstance, usersRepository: UsersRepository) {
  app.get('/users/me', async (request, reply) => {
    const authResult = await authenticateRequest(
      app,
      request.headers.authorization,
      usersRepository
    )

    if (authResult === null) {
      return reply.code(401).send(unauthorizedResponse)
    }

    return reply.code(200).send(toPublicUser(authResult.user))
  })
}
