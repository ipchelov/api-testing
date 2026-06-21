import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import { loggerOptions } from './utils/logger'

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: loggerOptions,
  })

  app.get('/health', async () => {
    return {
      status: 'ok',
    }
  })

  return app
}
