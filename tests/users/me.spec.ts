import type { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../src/app'

const unauthorizedResponse = {
  error: 'Unauthorized',
  message: 'Missing or invalid authentication token',
}

async function loginAsAdmin(app: FastifyInstance): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    body: {
      email: 'admin@example.com',
      password: 'Password123!1',
    },
  })

  expect(response.statusCode).toBe(200)

  const body = response.json()

  expect(body).toEqual({
    accessToken: expect.any(String),
    tokenType: 'Bearer',
    expiresIn: 3600,
  })

  return body.accessToken
}

describe('GET /users/me', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = buildApp()
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  it('returns current user when Bearer token is valid', async () => {
    const accessToken = await loginAsAdmin(app)

    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      id: 'user_1',
      email: 'admin@example.com',
      name: 'Admin',
      role: 'admin',
    })
  })

  it('returns 401 when Authorization header is missing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual(unauthorizedResponse)
  })

  it('returns 401 when Authorization header is malformed', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: {
        authorization: 'InvalidHeader',
      },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual(unauthorizedResponse)
  })

  it('returns 401 when Authorization header has an extra part', async () => {
    const accessToken = await loginAsAdmin(app)

    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: {
        authorization: `Bearer ${accessToken} extra`,
      },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual(unauthorizedResponse)
  })

  it('returns 401 when Authorization header has extra spaces', async () => {
    const accessToken = await loginAsAdmin(app)

    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: {
        authorization: `Bearer  ${accessToken}`,
      },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual(unauthorizedResponse)
  })

  it('returns 401 when token is invalid', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: {
        authorization: 'Bearer invalid-token',
      },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual(unauthorizedResponse)
  })

  it('returns 401 when token has expired', async () => {
    const accessToken = app.jwt.sign({ exp: Math.floor(Date.now() / 1000) - 60 }, { sub: 'user_1' })

    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual(unauthorizedResponse)
  })

  it('returns 401 when token subject does not match any user', async () => {
    const accessToken = app.jwt.sign(
      {
        email: 'unknown@example.com',
        role: 'admin',
      },
      {
        sub: 'unknown_user',
      }
    )

    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual(unauthorizedResponse)
  })
})
