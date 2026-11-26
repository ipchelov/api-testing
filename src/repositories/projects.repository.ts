import type { Pool } from 'pg'

export type ProjectFields = {
  name: string
  description?: string | null
}

type Project = {
  id: string
  name: string
  description: string | null
  creatorId: string
}

const projectColumns = 'id, name, description, creator_id AS "creatorId"'

export function createProjectsRepository(pool: Pool) {
  return {
    async create(id: string, creatorId: string, fields: ProjectFields): Promise<Project> {
      const result = await pool.query<Project>(
        `INSERT INTO public.projects (id, creator_id, name, description)
         VALUES ($1, $2, $3, $4) RETURNING ${projectColumns}`,
        [id, creatorId, fields.name, fields.description ?? null]
      )
      return result.rows[0]
    },

    async list(): Promise<Project[]> {
      const result = await pool.query<Project>(
        `SELECT ${projectColumns} FROM public.projects ORDER BY id ASC`
      )
      return result.rows
    },

    async findById(id: string): Promise<Project | undefined> {
      const result = await pool.query<Project>(
        `SELECT ${projectColumns} FROM public.projects WHERE id = $1`,
        [id]
      )
      return result.rows[0]
    },

    async update(id: string, fields: Partial<ProjectFields>): Promise<Project | undefined> {
      const result = await pool.query<Project>(
        `UPDATE public.projects
         SET name = COALESCE($2, name),
             description = CASE WHEN $3::boolean THEN $4::text ELSE description END
         WHERE id = $1 RETURNING ${projectColumns}`,
        [id, fields.name ?? null, fields.description !== undefined, fields.description ?? null]
      )
      return result.rows[0]
    },

    async remove(id: string): Promise<boolean> {
      const result = await pool.query('DELETE FROM public.projects WHERE id = $1', [id])
      return result.rowCount === 1
    },
  }
}

export type ProjectsRepository = ReturnType<typeof createProjectsRepository>
