import type { FastifyInstance } from 'fastify'
import type { FastifyError } from 'fastify'

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error.validation) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Invalid request body',
      })
    }

    request.log.error(error)

    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'Internal server error',
    })
  })
}
