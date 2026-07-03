import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import { registerErrorHandler } from './plugins/error-handler'
import { registerJwtPlugin } from './plugins/jwt'
import { registerAuthRoute } from './routes/auth'
import { registerUsersRoute } from './routes/users'
import { loggerOptions } from './utils/logger'

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: loggerOptions,
    ajv: {
      customOptions: {
        coerceTypes: false,
        removeAdditional: false,
      },
    },
  })

  registerErrorHandler(app)
  registerJwtPlugin(app)

  app.get('/health', async () => {
    return {
      status: 'ok',
    }
  })

  registerAuthRoute(app)
  registerUsersRoute(app)

  return app
}
