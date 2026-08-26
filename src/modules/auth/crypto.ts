import { hash, verify, type Options } from '@node-rs/argon2'

const passwordHashOptions = {
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} satisfies Options

export async function hashPassword(password: string): Promise<string> {
  return hash(password, passwordHashOptions)
}

export async function verifyPassword(hashValue: string, password: string): Promise<boolean> {
  return verify(hashValue, password)
}
