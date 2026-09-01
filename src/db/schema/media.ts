import { index, integer, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

import { contentEntries } from './content'

export const mediaState = pgEnum('media_state', ['pending', 'ready', 'failed'])

export const mediaObjects = pgTable(
  'media_objects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    storageKey: varchar('storage_key', { length: 512 }).notNull().unique(),
    originalName: varchar('original_name', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 120 }).notNull(),
    byteSize: integer('byte_size').notNull(),
    sha256: varchar('sha256', { length: 64 }).notNull(),
    altText: text('alt_text').notNull().default(''),
    state: mediaState('state').notNull().default('pending'),
    width: integer('width'),
    height: integer('height'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('media_objects_state_idx').on(table.state),
    index('media_objects_sha256_state_idx').on(table.sha256, table.state),
  ],
)

export const mediaVariants = pgTable('media_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  mediaId: uuid('media_id').notNull().references(() => mediaObjects.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 40 }).notNull(),
  storageKey: varchar('storage_key', { length: 512 }).notNull(),
  mimeType: varchar('mime_type', { length: 120 }).notNull(),
  byteSize: integer('byte_size').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('media_variants_media_name_unique').on(table.mediaId, table.name),
  uniqueIndex('media_variants_storage_key_unique').on(table.storageKey),
])

export const contentMedia = pgTable('content_media', {
  entryId: uuid('entry_id').notNull().references(() => contentEntries.id, { onDelete: 'cascade' }),
  mediaId: uuid('media_id').notNull().references(() => mediaObjects.id, { onDelete: 'restrict' }),
  position: integer('position').notNull().default(0),
  altText: text('alt_text').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ name: 'content_media_entry_media_pk', columns: [table.entryId, table.mediaId] }),
  index('content_media_entry_position_idx').on(table.entryId, table.position),
])
