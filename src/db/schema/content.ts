import { sql } from 'drizzle-orm'
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const contentType = pgEnum('content_type', ['blog', 'project', 'moment', 'page'])
export const contentStatus = pgEnum('content_status', ['draft', 'published', 'archived'])
export const exposure = pgEnum('exposure', ['full', 'summary', 'hidden'])

export const contentEntries = pgTable(
  'content_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    type: contentType('type').notNull(),
    slug: varchar('slug', { length: 160 }).notNull().unique(),
    title: varchar('title', { length: 240 }).notNull(),
    subtitle: varchar('subtitle', { length: 320 }),
    categoryLabel: varchar('category_label', { length: 120 }),
    summary: text('summary').notNull().default(''),
    exposure: exposure('exposure').notNull().default('full'),
    status: contentStatus('status').notNull().default('draft'),
    draftDocument: jsonb('draft_document')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{"type":"doc","content":[]}'::jsonb`),
    draftHtml: text('draft_html').notNull().default(''),
    draftPlainText: text('draft_plain_text').notNull().default(''),
    draftRevision: integer('draft_revision').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('content_entries_type_status_idx').on(table.type, table.status)],
)

export const contentVersions = pgTable(
  'content_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    entryId: uuid('entry_id')
      .notNull()
      .references(() => contentEntries.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(),
    slug: varchar('slug', { length: 160 }).notNull(),
    type: contentType('type').notNull(),
    title: varchar('title', { length: 240 }).notNull(),
    subtitle: varchar('subtitle', { length: 320 }),
    categoryLabel: varchar('category_label', { length: 120 }),
    summary: text('summary').notNull().default(''),
    exposure: exposure('exposure').notNull(),
    document: jsonb('document').$type<Record<string, unknown>>().notNull(),
    renderedHtml: text('rendered_html').notNull(),
    plainText: text('plain_text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('content_versions_entry_version_unique').on(table.entryId, table.versionNumber),
    index('content_versions_entry_id_idx').on(table.entryId),
  ],
)

export const contentPublications = pgTable(
  'content_publications',
  {
    entryId: uuid('entry_id')
      .primaryKey()
      .references(() => contentEntries.id, { onDelete: 'cascade' }),
    versionId: uuid('version_id')
      .notNull()
      .unique()
      .references(() => contentVersions.id, { onDelete: 'restrict' }),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('content_publications_version_id_idx').on(table.versionId)],
)
