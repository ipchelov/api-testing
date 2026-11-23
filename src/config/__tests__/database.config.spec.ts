import { afterEach, describe, expect, it, vi } from 'vitest'
import { assertDatabaseUrl, getDatabaseUrl } from '../database.config'

describe('test database configuration', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('accepts the explicit local test database', () => {
    expect(() =>
      assertDatabaseUrl(
        'postgresql://test:example@127.0.0.1:5432/api_testing_test',
        'api_testing_test'
      )
    ).not.toThrow()
  })

  it.each([
    'postgresql://localhost/api_testing',
    'postgresql://localhost/api_testing_test?database=api_testing',
    'postgresql://localhost/api_testing_test?options=-csearch_path=other',
    'postgresql://remote.example/api_testing_test',
    'postgresql://localhost:5433/api_testing_test',
    'invalid-url',
  ])('rejects an unsafe test target %s', (url) => {
    expect(() => assertDatabaseUrl(url, 'api_testing_test')).toThrow()
  })

  it('never falls back to DATABASE_URL', () => {
    vi.stubEnv('TEST_DATABASE_URL', undefined)
    vi.stubEnv('DATABASE_URL', 'postgresql://localhost/api_testing')
    expect(() => getDatabaseUrl('api_testing_test')).toThrow('TEST_DATABASE_URL')
  })
})
