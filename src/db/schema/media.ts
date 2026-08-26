import { index, integer, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const mediaState = pgEnum('media_state', ['pending', 'ready', 'failed'])

export const mediaObjects = pgTable(
  'media_objects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    storageKey: varchar('storage_key', { length: 512 }).notNull().unique(),
    originalName: varchar('original_name', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 120 }).notNull(),
    byteSize: integer('byte_size').notNull(),
    state: mediaState('state').notNull().default('pending'),
    width: integer('width'),
    height: integer('height'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('media_objects_state_idx').on(table.state)],
)
