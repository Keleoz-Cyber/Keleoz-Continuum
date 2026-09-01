import { boolean, index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

import { contentEntries } from './content'
import { mediaObjects } from './media'

export const personaReviewAction = pgEnum('persona_review_action', ['post', 'comment', 'reply', 'repost'])
export const personaReviewStatus = pgEnum('persona_review_status', ['pending', 'approved', 'rejected', 'deleted'])

export const momentPersonas = pgTable('moment_personas', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  handle: varchar('handle', { length: 80 }).notNull(),
  description: text('description').notNull().default(''),
  systemPrompt: text('system_prompt').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  canPost: boolean('can_post').notNull().default(false),
  canComment: boolean('can_comment').notNull().default(false),
  canRepost: boolean('can_repost').notNull().default(false),
  canUseImages: boolean('can_use_images').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex('moment_personas_handle_unique').on(table.handle)])

export const momentComments = pgTable('moment_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  entryId: uuid('entry_id').notNull().references(() => contentEntries.id, { onDelete: 'cascade' }),
  personaId: uuid('persona_id').notNull().references(() => momentPersonas.id, { onDelete: 'restrict' }),
  parentCommentId: uuid('parent_comment_id'),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('moment_comments_entry_created_idx').on(table.entryId, table.createdAt),
  index('moment_comments_parent_idx').on(table.parentCommentId),
])

export const momentAuthorships = pgTable('moment_authorships', {
  entryId: uuid('entry_id').primaryKey().references(() => contentEntries.id, { onDelete: 'cascade' }),
  personaId: uuid('persona_id').notNull().references(() => momentPersonas.id, { onDelete: 'restrict' }),
  repostOfEntryId: uuid('repost_of_entry_id').references(() => contentEntries.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('moment_authorships_persona_idx').on(table.personaId)])

export const personaReviews = pgTable('persona_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  personaId: uuid('persona_id').notNull().references(() => momentPersonas.id, { onDelete: 'cascade' }),
  action: personaReviewAction('action').notNull(),
  status: personaReviewStatus('status').notNull().default('pending'),
  targetEntryId: uuid('target_entry_id').references(() => contentEntries.id, { onDelete: 'set null' }),
  targetCommentId: uuid('target_comment_id'),
  content: text('content').notNull(),
  imagePrompt: text('image_prompt'),
  mediaObjectId: uuid('media_object_id').references(() => mediaObjects.id, { onDelete: 'set null' }),
  reviewedContent: text('reviewed_content'),
  publishedEntryId: uuid('published_entry_id').references(() => contentEntries.id, { onDelete: 'set null' }),
  publishedCommentId: uuid('published_comment_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
}, (table) => [
  index('persona_reviews_status_created_idx').on(table.status, table.createdAt),
  index('persona_reviews_persona_created_idx').on(table.personaId, table.createdAt),
])
