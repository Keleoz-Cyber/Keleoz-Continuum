import { index, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}

export const owners = pgTable('owners', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 64 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  ...timestamps,
})

export const sessions = pgTable(
  'sessions',
  {
    tokenHash: varchar('token_hash', { length: 64 }).primaryKey(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => owners.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('sessions_owner_id_idx').on(table.ownerId), index('sessions_expires_at_idx').on(table.expiresAt)],
)

export const loginThrottles = pgTable('login_throttles', {
  fingerprintHash: varchar('fingerprint_hash', { length: 64 }).primaryKey(),
  failures: integer('failures').notNull().default(0),
  blockedUntil: timestamp('blocked_until', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
