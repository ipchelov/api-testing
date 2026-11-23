import { buildApp } from './app'

const app = buildApp()

async function shutdown() {
  try {
    await app.close()
  } catch {
    app.log.error('Application shutdown failed')
    process.exitCode = 1
  }
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)

try {
  await app.listen({ port: 3000 })
} catch {
  app.log.error('Application startup failed; check configuration and PostgreSQL availability')
  process.exitCode = 1
  await shutdown()
}
