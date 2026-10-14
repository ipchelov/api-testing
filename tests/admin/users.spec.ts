import type { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../src/app'

const unauthorizedResponse = {
  error: 'Unauthorized',
  message: 'Missing or invalid authentication token',
}

const forbiddenResponse = {
  error: 'Forbidden',
  message: 'Insufficient permissions',
}

async function login(app: FastifyInstance, email: string, password: string): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    body: { email, password },
  })

  expect(response.statusCode).toBe(200)

  const body = response.json()
  expect(body.accessToken).toEqual(expect.any(String))

  return body.accessToken
}

describe('GET /admin/users', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = buildApp()
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  it('returns public users for an admin', async () => {
    const accessToken = await login(app, 'admin@example.com', 'Password123!1')

    const response = await app.inject({
      method: 'GET',
      url: '/admin/users',
      headers: { authorization: `Bearer ${accessToken}` },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([
      {
        id: 'user_1',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'admin',
      },
      {
        id: 'user_2',
        email: 'viewer@example.com',
        name: 'Viewer',
        role: 'viewer',
      },
    ])
  })

  it('returns 403 for a viewer', async () => {
    const accessToken = await login(app, 'viewer@example.com', 'Password123!2')

    const response = await app.inject({
      method: 'GET',
      url: '/admin/users',
      headers: { authorization: `Bearer ${accessToken}` },
    })

    expect(response.statusCode).toBe(403)
    expect(response.json()).toEqual(forbiddenResponse)
  })

  it('returns 401 without an Authorization header', async () => {
    const response = await app.inject({ method: 'GET', url: '/admin/users' })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual(unauthorizedResponse)
  })

  it('returns 401 for a malformed Bearer header', async () => {
    const accessToken = await login(app, 'admin@example.com', 'Password123!1')

    const response = await app.inject({
      method: 'GET',
      url: '/admin/users',
      headers: { authorization: `Bearer ${accessToken} extra` },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual(unauthorizedResponse)
  })

  it('returns 401 for an invalid token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/admin/users',
      headers: { authorization: 'Bearer invalid-token' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual(unauthorizedResponse)
  })

  it('returns 401 when the token role is changed without updating the signature', async () => {
    const accessToken = await login(app, 'viewer@example.com', 'Password123!2')
    const [header, payload, signature] = accessToken.split('.')
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    claims.role = 'admin'

    const modifiedPayload = Buffer.from(JSON.stringify(claims)).toString('base64url')
    const modifiedToken = `${header}.${modifiedPayload}.${signature}`

    const response = await app.inject({
      method: 'GET',
      url: '/admin/users',
      headers: { authorization: `Bearer ${modifiedToken}` },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual(unauthorizedResponse)
  })

  it('returns 401 for an expired token', async () => {
    const accessToken = app.jwt.sign(
      { role: 'admin', exp: Math.floor(Date.now() / 1000) - 60 },
      { sub: 'user_1' }
    )

    const response = await app.inject({
      method: 'GET',
      url: '/admin/users',
      headers: { authorization: `Bearer ${accessToken}` },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual(unauthorizedResponse)
  })

  it('returns 401 when the token subject does not match a user', async () => {
    const accessToken = app.jwt.sign({ role: 'admin' }, { sub: 'unknown_user' })

    const response = await app.inject({
      method: 'GET',
      url: '/admin/users',
      headers: { authorization: `Bearer ${accessToken}` },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual(unauthorizedResponse)
  })

  it('returns 401 when the token has no role', async () => {
    const accessToken = app.jwt.sign({ email: 'admin@example.com' }, { sub: 'user_1' })

    const response = await app.inject({
      method: 'GET',
      url: '/admin/users',
      headers: { authorization: `Bearer ${accessToken}` },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual(unauthorizedResponse)
  })

  it('returns 401 when the token has an unsupported role', async () => {
    const accessToken = app.jwt.sign({ role: 'owner' }, { sub: 'user_1' })

    const response = await app.inject({
      method: 'GET',
      url: '/admin/users',
      headers: { authorization: `Bearer ${accessToken}` },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual(unauthorizedResponse)
  })
})
