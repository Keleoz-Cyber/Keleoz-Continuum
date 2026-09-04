import 'server-only'

import { db } from '@/db/client'
import { AiProviderError, createOpenAiCompatibleProvider } from '@/modules/ai/provider'
import { createAiConcurrencyGate, getSharedAiConcurrencyGate } from '@/modules/ai/quota'
import { createAiQuotaRepository } from '@/modules/ai/repository'
import { createOwnerChatService } from '@/modules/owner-chat/service'
import { ownerKnowledgeRepository } from '@/modules/owner-memory/runtime'
import { serverEnv } from '@/shared/env'

const runtimeGlobal = globalThis as typeof globalThis & {
  continuumAiGate?: ReturnType<typeof createAiConcurrencyGate>
}
const provider = serverEnv.AI_GATEWAY_ENABLED
  ? createOpenAiCompatibleProvider({
      baseUrl: serverEnv.AI_BASE_URL!, apiKey: serverEnv.AI_API_KEY!, model: serverEnv.AI_MODEL!,
      maxOutputTokens: serverEnv.AI_CHAT_MAX_OUTPUT_TOKENS, timeoutMs: serverEnv.AI_TIMEOUT_MS,
    })
  : { async complete(): Promise<never> { throw new AiProviderError('upstream_error') } }

export const ownerChatService = createOwnerChatService({
  repository: ownerKnowledgeRepository,
  quota: createAiQuotaRepository(db),
  gate: getSharedAiConcurrencyGate(runtimeGlobal, serverEnv.AI_GLOBAL_MAX_CONCURRENCY),
  provider,
  providerName: 'openai-compatible',
  model: serverEnv.AI_MODEL ?? 'disabled',
  maxOutputTokens: serverEnv.AI_CHAT_MAX_OUTPUT_TOKENS,
  maxRequestsPerThread: serverEnv.AI_CHAT_MAX_REQUESTS_PER_THREAD,
  maxRequestsPerOwnerDay: serverEnv.AI_CHAT_MAX_REQUESTS_PER_OWNER_DAY,
  dailyBudgetMicroUsd: serverEnv.AI_DAILY_BUDGET_MICRO_USD,
  inputMicroUsdPerMillionTokens: serverEnv.AI_INPUT_MICRO_USD_PER_MILLION_TOKENS,
  outputMicroUsdPerMillionTokens: serverEnv.AI_OUTPUT_MICRO_USD_PER_MILLION_TOKENS,
})

export const ownerChatAiEnabled = serverEnv.AI_GATEWAY_ENABLED
