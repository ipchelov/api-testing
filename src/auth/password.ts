import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

const keyLength = 64
const scryptOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }

// Unknown users still incur the same password verification work.
export const dummyPasswordHash = `scrypt-v1$${'0'.repeat(32)}$${'0'.repeat(128)}`

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, scryptOptions, (error, key) => {
      if (error) reject(error)
      else resolve(key)
    })
  })
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await deriveKey(password, salt)
  return `scrypt-v1$${salt.toString('hex')}$${key.toString('hex')}`
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const match = /^scrypt-v1\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(passwordHash)
  if (!match) return false

  const key = await deriveKey(password, Buffer.from(match[1], 'hex'))
  return timingSafeEqual(key, Buffer.from(match[2], 'hex'))
}
