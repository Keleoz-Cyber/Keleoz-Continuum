import { boolean, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'

export const operationSettings = pgTable('operation_settings', {
  id: varchar('id', { length: 32 }).primaryKey(),
  guestAiEnabled: boolean('guest_ai_enabled').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
