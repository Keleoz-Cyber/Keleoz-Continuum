import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const ownerChatRole = pgEnum('owner_chat_role', ['user', 'assistant'])
export const ownerMemoryVisibility = pgEnum('owner_memory_visibility', ['public', 'only', 'except', 'private'])
export const ownerAutoMemoryPriority = pgEnum('owner_auto_memory_priority', ['always', 'normal', 'low'])

export const ownerChatCompanions = pgTable('owner_chat_companions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  description: text('description').notNull().default(''),
  systemPrompt: text('system_prompt').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  memoryEnabled: boolean('memory_enabled').notNull().default(true),
  autoMemoryEnabled: boolean('auto_memory_enabled').notNull().default(true),
  autoMemoryMode: varchar('auto_memory_mode', { length: 20 }).notNull().default('hybrid'),
  autoMemoryBudget: integer('auto_memory_budget').notNull().default(1_200),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const ownerChatThreads = pgTable('owner_chat_threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  companionId: uuid('companion_id').notNull().references(() => ownerChatCompanions.id, { onDelete: 'restrict' }),
  title: varchar('title', { length: 160 }).notNull().default('New conversation'),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('owner_chat_threads_companion_updated_idx').on(table.companionId, table.updatedAt)])

export const ownerChatMessages = pgTable('owner_chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  threadId: uuid('thread_id').notNull().references(() => ownerChatThreads.id, { onDelete: 'cascade' }),
  role: ownerChatRole('role').notNull(),
  content: text('content').notNull(),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  autoMemoryEvents: jsonb('auto_memory_events').$type<Array<{ ok: boolean; label: string; detail: string }>>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('owner_chat_messages_thread_created_idx').on(table.threadId, table.createdAt)])

export const ownerMemories = pgTable('owner_memories', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 240 }).notNull(),
  summary: text('summary').notNull().default(''),
  content: text('content').notNull(),
  oneLine: text('one_line').notNull().default(''),
  domain: varchar('domain', { length: 80 }).notNull().default('日常'),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  valence: doublePrecision('valence').notNull().default(0.5),
  arousal: doublePrecision('arousal').notNull().default(0.3),
  importance: integer('importance').notNull().default(5),
  pinned: boolean('pinned').notNull().default(false),
  resolved: boolean('resolved').notNull().default(false),
  visibility: ownerMemoryVisibility('visibility').notNull().default('public'),
  visibleTo: jsonb('visible_to').$type<string[]>().notNull().default([]),
  excludeFrom: jsonb('exclude_from').$type<string[]>().notNull().default([]),
  activationCount: integer('activation_count').notNull().default(0),
  lastActivatedAt: timestamp('last_activated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByCompanionId: uuid('created_by_companion_id').references(() => ownerChatCompanions.id, { onDelete: 'set null' }),
  createdByName: varchar('created_by_name', { length: 120 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('owner_memories_created_idx').on(table.createdAt),
  index('owner_memories_domain_idx').on(table.domain),
])

export const ownerAutoMemories = pgTable('owner_auto_memories', {
  id: uuid('id').defaultRandom().primaryKey(),
  companionId: uuid('companion_id').notNull().references(() => ownerChatCompanions.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 40 }).notNull(),
  priority: ownerAutoMemoryPriority('priority').notNull().default('normal'),
  content: text('content').notNull(),
  archived: boolean('archived').notNull().default(false),
  updatedBy: varchar('updated_by', { length: 120 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('owner_auto_memories_companion_created_idx').on(table.companionId, table.createdAt)])
