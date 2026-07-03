import fastifyJwt from '@fastify/jwt'
import type { FastifyInstance } from 'fastify'
import { authConfig } from '../config/auth.config'

export function registerJwtPlugin(app: FastifyInstance) {
  app.register(fastifyJwt, {
    secret: authConfig.jwtSecret,
  })
}
