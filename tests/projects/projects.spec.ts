import type { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { withDatabaseTransaction } from '../../src/db/database'
import { buildTestApp, useTestDatabase } from '../helpers/database'

type Project = { id: string; name: string; description: string | null; creatorId: string }

const missingId = '00000000-0000-4000-8000-000000000001'

describe('Projects API', () => {
  const database = useTestDatabase()
  let app: FastifyInstance
  let adminHeaders: { authorization: string }
  let viewerHeaders: { authorization: string }

  beforeEach(async () => {
    app = buildTestApp()
    await app.ready()
    adminHeaders = { authorization: 'Bearer ' + app.jwt.sign({ role: 'admin' }, { sub: 'user_1' }) }
    viewerHeaders = {
      authorization: 'Bearer ' + app.jwt.sign({ role: 'viewer' }, { sub: 'user_2' }),
    }
  })

  afterEach(async () => {
    if (app) await app.close()
  })

  async function createProject(name = 'Project'): Promise<Project> {
    const response = await app.inject({
      method: 'POST',
      url: '/projects',
      headers: adminHeaders,
      payload: { name },
    })
    expect(response.statusCode).toBe(201)
    return response.json<Project>()
  }

  it('lets an admin create, read, patch, and delete a project', async () => {
    const project = await createProject(`  ${'a'.repeat(120)}  `)
    expect(project).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      name: 'a'.repeat(120),
      description: null,
      creatorId: 'user_1',
    })
    const url = `/projects/${project.id}`
    const read = await app.inject({ method: 'GET', url, headers: adminHeaders })
    expect(read.statusCode).toBe(200)
    expect(read.json()).toEqual(project)

    const update = await app.inject({
      method: 'PATCH',
      url,
      headers: adminHeaders,
      payload: { name: 'Updated project' },
    })
    expect(update.statusCode).toBe(200)
    expect(update.json()).toEqual({ ...project, name: 'Updated project' })

    const deleted = await app.inject({ method: 'DELETE', url, headers: adminHeaders })
    expect(deleted.statusCode).toBe(204)
    expect(deleted.body).toBe('')
    const readAfterDelete = await app.inject({ method: 'GET', url, headers: adminHeaders })
    expect(readAfterDelete.statusCode).toBe(404)
  })

  it('preserves omitted fields and clears the description with null', async () => {
    const project = await createProject()
    const url = `/projects/${project.id}`

    const updateDescription = await app.inject({
      method: 'PATCH',
      url,
      headers: adminHeaders,
      payload: { description: 'Project details' },
    })
    expect(updateDescription.statusCode).toBe(200)
    expect(updateDescription.json()).toEqual({ ...project, description: 'Project details' })

    const rename = await app.inject({
      method: 'PATCH',
      url,
      headers: adminHeaders,
      payload: { name: ' Renamed ' },
    })
    expect(rename.statusCode).toBe(200)
    expect(rename.json()).toEqual({ ...project, name: 'Renamed', description: 'Project details' })

    const clear = await app.inject({
      method: 'PATCH',
      url,
      headers: adminHeaders,
      payload: { description: null },
    })
    expect(clear.statusCode).toBe(200)
    expect(clear.json()).toEqual({ ...project, name: 'Renamed' })
  })

  it('lets a viewer read an empty list and projects in ID order', async () => {
    const empty = await app.inject({ url: '/projects', headers: viewerHeaders })
    expect(empty.statusCode).toBe(200)
    expect(empty.json()).toEqual([])

    const lowerId = '00000000-0000-4000-8000-000000000002'
    const higherId = '00000000-0000-4000-8000-000000000003'
    const lowerProject = { id: lowerId, name: 'Lower ID', description: null, creatorId: 'user_1' }
    const higherProject = { ...lowerProject, id: higherId, name: 'Higher ID' }
    await withDatabaseTransaction(database.pool, 'api_testing_test', async (client) => {
      // Insert in reverse ID order so the test does not rely on random UUIDs.
      for (const project of [higherProject, lowerProject]) {
        await client.query(
          'INSERT INTO public.projects (id, name, creator_id) VALUES ($1, $2, $3)',
          [project.id, project.name, project.creatorId]
        )
      }
    })

    const list = await app.inject({ url: '/projects', headers: viewerHeaders })
    expect(list.statusCode).toBe(200)
    expect(list.json()).toEqual([lowerProject, higherProject])
    const read = await app.inject({ url: `/projects/${lowerId}`, headers: viewerHeaders })
    expect(read.statusCode).toBe(200)
    expect(read.json()).toEqual(lowerProject)
  })

  it('rejects viewer writes and preserves projects', async () => {
    const project = await createProject()
    const url = `/projects/${project.id}`
    for (const request of [
      { method: 'POST', url: '/projects', payload: { name: 'Forbidden' } },
      { method: 'PATCH', url, payload: { name: 'Forbidden' } },
      { method: 'DELETE', url },
    ] as const) {
      expect((await app.inject({ ...request, headers: viewerHeaders })).statusCode).toBe(403)
    }
    const list = await app.inject({ url: '/projects', headers: adminHeaders })
    expect(list.json()).toEqual([project])
  })

  it('checks viewer write permissions before validating the request', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/projects/not-a-uuid',
      headers: viewerHeaders,
      payload: {},
    })
    expect(response.statusCode).toBe(403)
  })

  it('returns 401 when listing projects without a token', async () => {
    const response = await app.inject({ method: 'GET', url: '/projects' })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 when creating a project with an invalid token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/projects',
      headers: { authorization: 'Bearer invalid-token' },
      payload: { name: 'Project' },
    })
    expect(response.statusCode).toBe(401)
  })

  it.each([
    { reason: 'blank name', payload: { name: '  ' } },
    { reason: 'name longer than 120 characters', payload: { name: 'a'.repeat(121) } },
    {
      reason: 'description longer than 2,000 characters',
      payload: { name: 'Project', description: 'a'.repeat(2001) },
    },
    { reason: 'client-supplied creatorId', payload: { name: 'Project', creatorId: 'user_2' } },
    { reason: 'NUL in description', payload: { name: 'Project', description: 'NUL\0character' } },
  ])('returns 400 when creating a project with $reason', async ({ payload }) => {
    const response = await app.inject({
      method: 'POST',
      url: '/projects',
      headers: adminHeaders,
      payload,
    })
    expect(response.statusCode).toBe(400)
  })

  it('returns 400 when patching a project with an empty body', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/projects/${missingId}`,
      headers: adminHeaders,
      payload: {},
    })
    expect(response.statusCode).toBe(400)
  })

  it('returns 400 when reading a project with an invalid UUID', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/projects/not-a-uuid',
      headers: adminHeaders,
    })
    expect(response.statusCode).toBe(400)
  })

  it('returns 404 when updating an absent project', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/projects/${missingId}`,
      headers: adminHeaders,
      payload: { name: 'Missing' },
    })
    expect(response.statusCode).toBe(404)
  })

  it('returns 404 when deleting an absent project', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/projects/${missingId}`,
      headers: adminHeaders,
    })
    expect(response.statusCode).toBe(404)
  })
})
