import type { FastifyInstance } from 'fastify'
import { authConfig } from '../config/auth.config'
import { dummyPasswordHash, verifyPassword } from '../auth/password'
import type { UsersRepository } from '../repositories/users.repository'
import { loginBodySchema } from '../schemas/auth.schemas'

type LoginBody = {
  email: string
  password: string
}

const loginWindowMs = 60_000
const maxLoginAttempts = 10
const maxTrackedLoginIps = 1024

export function registerAuthRoute(app: FastifyInstance, usersRepository: UsersRepository) {
  const attemptsByIp = new Map<string, number>()
  let windowEndsAt = 0

  app.post<{
    Body: LoginBody
  }>(
    '/auth/login',
    {
      schema: {
        body: loginBodySchema,
      },
      async preHandler(request, reply) {
        const now = performance.now()
        if (now >= windowEndsAt) {
          attemptsByIp.clear()
          windowEndsAt = now + loginWindowMs
        }

        const attempts = attemptsByIp.get(request.ip)
        const limitReached =
          attempts === undefined
            ? attemptsByIp.size >= maxTrackedLoginIps
            : attempts >= maxLoginAttempts

        if (limitReached) {
          return reply
            .header('Retry-After', Math.ceil((windowEndsAt - now) / 1000))
            .code(429)
            .send({ error: 'Too Many Requests', message: 'Too many login attempts' })
        }

        attemptsByIp.set(request.ip, (attempts ?? 0) + 1)
      },
    },
    async (request, reply) => {
      const user = await usersRepository.findByEmail(request.body.email)
      const passwordMatches = await verifyPassword(
        request.body.password,
        user?.passwordHash ?? dummyPasswordHash
      )

      if (!user || !passwordMatches) {
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
