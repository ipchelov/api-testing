import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import type { Pool } from 'pg'
import { getDatabaseUrl } from './config/database.config'
import { createDatabasePool } from './db/database'
import { registerErrorHandler } from './plugins/error-handler'
import { registerJwtPlugin } from './plugins/jwt'
import { registerAdminRoute } from './routes/admin'
import { registerAuthRoute } from './routes/auth'
import { registerProjectsRoutes } from './routes/projects'
import { registerUsersRoute } from './routes/users'
import { createProjectsRepository } from './repositories/projects.repository'
import { createUsersRepository } from './repositories/users.repository'
import { loggerOptions } from './utils/logger'

export function buildApp(options: { pool?: Pool } = {}): FastifyInstance {
  const pool = options.pool ?? createDatabasePool(getDatabaseUrl('api_testing'))
  const app = Fastify({
    logger: loggerOptions,
    ajv: {
      customOptions: {
        coerceTypes: false,
        removeAdditional: false,
      },
    },
  })

  const usersRepository = createUsersRepository(pool)
  pool.on('error', () => app.log.error('Unexpected PostgreSQL pool error'))
  app.addHook('onReady', async () => {
    await pool.query('SELECT 1')
  })
  app.addHook('onClose', async () => {
    await pool.end()
  })

  registerErrorHandler(app)
  registerJwtPlugin(app)

  app.get('/health', async () => {
    return {
      status: 'ok',
    }
  })

  registerAuthRoute(app, usersRepository)
  registerUsersRoute(app, usersRepository)
  registerAdminRoute(app, usersRepository)
  registerProjectsRoutes(app, createProjectsRepository(pool), usersRepository)

  return app
}
