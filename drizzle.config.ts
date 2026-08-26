import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgres://continuum:continuum@127.0.0.1:55432/continuum',
  },
  strict: true,
  verbose: true,
})
