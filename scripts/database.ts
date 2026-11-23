import { getDatabaseUrl } from '../src/config/database.config'
import { createDatabasePool } from '../src/db/database'
import { migrate } from '../src/db/migrate'
import { createSeedUsers, seedUsers } from '../src/db/seed'

const [command, ...flags] = process.argv.slice(2)
if (!['migrate', 'seed'].includes(command) || flags.some((flag) => flag !== '--test')) {
  throw new Error('Usage: tsx scripts/database.ts <migrate|seed> [--test]')
}

const expectedDatabase = flags.includes('--test') ? 'api_testing_test' : 'api_testing'
const pool = createDatabasePool(getDatabaseUrl(expectedDatabase))
pool.on('error', () => {
  console.error('Unexpected PostgreSQL pool error')
  process.exitCode = 1
})

try {
  if (command === 'migrate') {
    await migrate(pool, expectedDatabase)
  } else {
    const adminPassword = process.env.SEED_ADMIN_PASSWORD
    const viewerPassword = process.env.SEED_VIEWER_PASSWORD
    if (!adminPassword || !viewerPassword) {
      throw new Error('SEED_ADMIN_PASSWORD and SEED_VIEWER_PASSWORD are required')
    }
    await seedUsers(pool, await createSeedUsers(adminPassword, viewerPassword), expectedDatabase)
  }
  console.log(`${command} completed for ${expectedDatabase}`)
} catch {
  // Connection strings, seed passwords, and PostgreSQL row details must not enter CLI output.
  console.error(
    `${command} failed for ${expectedDatabase}; check configuration and migration state`
  )
  process.exitCode = 1
} finally {
  await pool.end()
}
