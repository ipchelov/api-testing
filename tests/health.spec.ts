import type { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildTestApp, useTestDatabase } from './helpers/database'

describe('GET /health', () => {
  useTestDatabase()
  let app: FastifyInstance

  beforeEach(() => {
    app = buildTestApp()
  })

  afterEach(async () => {
    if (app) await app.close()
  })

  it('returns 200 with API health status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      status: 'ok',
    })
  })
})
