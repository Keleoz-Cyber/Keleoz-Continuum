import { index, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const aiUsageEvents = pgTable(
  'ai_usage_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    feature: varchar('feature', { length: 32 }).notNull(),
    sourceHash: varchar('source_hash', { length: 64 }).notNull(),
    sessionId: uuid('session_id').notNull(),
    status: varchar('status', { length: 24 }).notNull().default('reserved'),
    provider: varchar('provider', { length: 80 }).notNull(),
    model: varchar('model', { length: 160 }).notNull(),
    inputCharacters: integer('input_characters').notNull(),
    outputCharacters: integer('output_characters').notNull().default(0),
    promptTokens: integer('prompt_tokens'),
    completionTokens: integer('completion_tokens'),
    reservedCostMicroUsd: integer('reserved_cost_micro_usd').notNull(),
    providerRequestId: varchar('provider_request_id', { length: 160 }),
    errorCode: varchar('error_code', { length: 80 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('ai_usage_source_feature_created_idx').on(table.sourceHash, table.feature, table.createdAt),
    index('ai_usage_session_created_idx').on(table.sessionId, table.createdAt),
    index('ai_usage_created_at_idx').on(table.createdAt),
  ],
)
