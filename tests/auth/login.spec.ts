import type { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../src/app'

const unauthorizedResponse = {
  error: 'Unauthorized',
  message: 'Invalid email or password',
}

const badRequestResponse = {
  error: 'Bad Request',
  message: 'Invalid request body',
}

describe('POST /auth/login', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = buildApp()
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  it('returns 200 with access token for valid credentials', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: {
        email: 'admin@example.com',
        password: 'Password123!1',
      },
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body).toEqual({
      accessToken: expect.any(String),
      tokenType: 'Bearer',
      expiresIn: 3600,
    })

    const decoded = app.jwt.verify(body.accessToken)

    expect(decoded).toMatchObject({
      sub: 'user_1',
      email: 'admin@example.com',
      role: 'admin',
    })
    expect(decoded).not.toHaveProperty('password')
  })

  it('returns 401 with wrong password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: {
        email: 'admin@example.com',
        password: 'wrongPassword',
      },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual(unauthorizedResponse)
  })

  it('returns 401 with unknown email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: {
        email: 'unknown@example.com',
        password: 'Password123!1',
      },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual(unauthorizedResponse)
  })

  it('returns 400 when email is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: {
        password: 'Password123!1',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual(badRequestResponse)
  })

  it('returns 400 when password is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: {
        email: 'admin@example.com',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual(badRequestResponse)
  })

  it('returns 400 when email type is invalid', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: {
        email: 123,
        password: 'Password123!1',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual(badRequestResponse)
  })

  it('returns 400 when password type is invalid', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: {
        email: 'admin@example.com',
        password: null,
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual(badRequestResponse)
  })

  it('returns 400 when email is empty', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: {
        email: '',
        password: 'Password123!1',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual(badRequestResponse)
  })

  it('returns 400 when password is empty', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: {
        email: 'admin@example.com',
        password: '',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual(badRequestResponse)
  })

  it('returns 400 when request body contains unexpected fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: {
        email: 'admin@example.com',
        password: 'Password123!1',
        role: 'admin',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual(badRequestResponse)
  })
})
