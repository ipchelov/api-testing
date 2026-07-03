import type { FastifyInstance } from 'fastify'
import { authConfig } from '../config/auth.config'
import { findUserByEmail } from '../fake-db/users'
import { loginBodySchema } from '../schemas/auth.schemas'

type LoginBody = {
  email: string
  password: string
}

export function registerAuthRoute(app: FastifyInstance) {
  app.post<{
    Body: LoginBody
  }>(
    '/auth/login',
    {
      schema: {
        body: loginBodySchema,
      },
    },
    (request, reply) => {
      const user = findUserByEmail(request.body.email)

      if (!user || request.body.password !== user.password) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        })
      }

      const accessToken = app.jwt.sign(
        {
          email: user.email,
          role: user.role,
        },
        {
          sub: user.id,
          expiresIn: authConfig.accessTokenExpiresIn,
        }
      )

      return reply.code(200).send({
        accessToken,
        tokenType: authConfig.tokenType,
        expiresIn: authConfig.accessTokenExpiresInSeconds,
      })
    }
  )
}
