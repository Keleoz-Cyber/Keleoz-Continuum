import { jsonb, pgTable, primaryKey, timestamp, varchar } from 'drizzle-orm/pg-core'

// Original UI records retain their original shape behind the single-Owner DAL.
export const ownerSourceRecords = pgTable('owner_source_records', {
  store: varchar('store', { length: 40 }).notNull(),
  key: varchar('key', { length: 180 }).notNull(),
  value: jsonb('value').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.store, table.key] })])
