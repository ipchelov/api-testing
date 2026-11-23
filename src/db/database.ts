import { Pool } from 'pg'
import type { PoolClient } from 'pg'
import type { DatabaseName } from '../config/database.config'

export function createDatabasePool(connectionString: string): Pool {
  return new Pool({ connectionString, max: 5, connectionTimeoutMillis: 5000 })
}

export async function assertDatabase(
  connection: Pick<PoolClient, 'query'>,
  expectedDatabase: DatabaseName
): Promise<void> {
  const result = await connection.query<{ name: string }>('SELECT current_database() AS name')
  if (result.rows[0]?.name !== expectedDatabase) {
    throw new Error(`Refusing database changes: expected ${expectedDatabase}`)
  }
}

export async function withDatabaseTransaction(
  pool: Pool,
  expectedDatabase: DatabaseName,
  operation: (client: PoolClient) => Promise<void>
): Promise<void> {
  const client = await pool.connect()
  try {
    // Verify the actual target on the same connection before any write.
    await assertDatabase(client, expectedDatabase)
    await client.query('BEGIN')
    try {
      await operation(client)
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  } finally {
    client.release()
  }
}
