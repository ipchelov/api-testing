export type DatabaseName = 'api_testing' | 'api_testing_test'

export function assertDatabaseUrl(connectionString: string, expectedDatabase: DatabaseName): void {
  let url: URL
  try {
    url = new URL(connectionString)
  } catch {
    throw new Error('Invalid database connection URL')
  }

  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    url.pathname !== `/${expectedDatabase}`
  ) {
    throw new Error(`Expected a PostgreSQL URL targeting ${expectedDatabase}`)
  }

  if (url.search !== '' || url.hash !== '') {
    throw new Error('Database URL must not contain connection overrides')
  }

  if (expectedDatabase === 'api_testing_test') {
    const isLocalhost = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
    const hasAllowedPort = url.port === '' || url.port === '5432'

    if (!isLocalhost || !hasAllowedPort) {
      throw new Error('Test database must use local PostgreSQL on port 5432')
    }
  }
}

export function getDatabaseUrl(expectedDatabase: DatabaseName): string {
  const variable = expectedDatabase === 'api_testing_test' ? 'TEST_DATABASE_URL' : 'DATABASE_URL'
  const connectionString = process.env[variable]
  if (!connectionString) throw new Error(`${variable} environment variable is required`)

  assertDatabaseUrl(connectionString, expectedDatabase)
  return connectionString
}
