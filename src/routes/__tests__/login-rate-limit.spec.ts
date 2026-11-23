import Fastify from 'fastify'
import { expect, it, vi } from 'vitest'
import { registerAuthRoute } from '../auth'

it('limits login attempts per IP before the repository lookup and resets after the window', async () => {
  const app = Fastify()
  const findByEmail = vi.fn(async () => undefined)
  registerAuthRoute(app, {
    findByEmail,
    findById: async () => undefined,
    listPublicUsers: async () => [],
  })

  await app.ready()
  const clock = vi.spyOn(performance, 'now').mockReturnValue(1000)

  function login(remoteAddress: string) {
    return app.inject({
      method: 'POST',
      url: '/auth/login',
      remoteAddress,
      payload: { email: 'unknown@example.com', password: 'example-password' },
    })
  }

  try {
    const clientIp = '192.0.2.1'
    const invalid = await app.inject({
      method: 'POST',
      url: '/auth/login',
      remoteAddress: clientIp,
      payload: { email: 'unknown@example.com' },
    })
    expect(invalid.statusCode).toBe(400)

    for (let attempt = 0; attempt < 10; attempt++) {
      expect((await login(clientIp)).statusCode).toBe(401)
    }

    const limited = await login(clientIp)
    expect(limited.statusCode).toBe(429)
    expect(limited.headers['retry-after']).toBe('60')
    expect(findByEmail).toHaveBeenCalledTimes(10)

    expect((await login('192.0.2.2')).statusCode).toBe(401)

    clock.mockReturnValue(61_000)
    expect((await login(clientIp)).statusCode).toBe(401)
  } finally {
    clock.mockRestore()
    await app.close()
  }
})
