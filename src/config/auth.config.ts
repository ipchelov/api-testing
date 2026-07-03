const jwtSecret = process.env.JWT_SECRET

if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required')
}

export const authConfig = {
  jwtSecret,
  tokenType: 'Bearer',
  accessTokenExpiresIn: '1h',
  accessTokenExpiresInSeconds: 3600,
} as const
