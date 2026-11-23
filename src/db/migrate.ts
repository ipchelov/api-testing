import { readdir, readFile } from 'node:fs/promises'
import type { Pool } from 'pg'
import type { DatabaseName } from '../config/database.config'
import { withDatabaseTransaction } from './database'

export async function migrate(pool: Pool, expectedDatabase: DatabaseName): Promise<void> {
  const directory = new URL('./migrations/', import.meta.url)
  const files = (await readdir(directory))
    .filter((name) => /^\d+_[a-z0-9_]+\.sql$/.test(name))
    .sort()

  await withDatabaseTransaction(pool, expectedDatabase, async (client) => {
    await client.query(`CREATE TABLE IF NOT EXISTS public.schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`)
    const applied = await client.query<{ name: string }>(
      'SELECT name FROM public.schema_migrations'
    )
    const appliedNames = new Set(applied.rows.map((row) => row.name))

    for (const name of files) {
      if (appliedNames.has(name)) continue
      await client.query(await readFile(new URL(name, directory), 'utf8'))
      await client.query('INSERT INTO public.schema_migrations (name) VALUES ($1)', [name])
    }
  })
}
