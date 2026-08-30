import 'server-only'

import { db } from '@/db/client'
import { AiProviderError, createOpenAiCompatibleProvider } from '@/modules/ai/provider'
import { createAiConcurrencyGate, getSharedAiConcurrencyGate } from '@/modules/ai/quota'
import { createAiQuotaRepository } from '@/modules/ai/repository'
import { serverEnv } from '@/shared/env'
import { createStoryService } from './service'

const runtimeGlobal = globalThis as typeof globalThis & {
  continuumAiGate?: ReturnType<typeof createAiConcurrencyGate>
}

const gate = getSharedAiConcurrencyGate(runtimeGlobal, serverEnv.AI_GLOBAL_MAX_CONCURRENCY)

function disabledProvider() {
  return {
    async complete(): Promise<never> {
      throw new AiProviderError('upstream_error')
    },
  }
}

const turnProvider = serverEnv.AI_GATEWAY_ENABLED
  ? createOpenAiCompatibleProvider({
      baseUrl: serverEnv.AI_BASE_URL!,
      apiKey: serverEnv.AI_API_KEY!,
      model: serverEnv.AI_MODEL!,
      maxOutputTokens: serverEnv.AI_STORY_MAX_OUTPUT_TOKENS,
      timeoutMs: serverEnv.AI_TIMEOUT_MS,
    })
  : disabledProvider()

const documentProvider = serverEnv.AI_GATEWAY_ENABLED
  ? createOpenAiCompatibleProvider({
      baseUrl: serverEnv.AI_BASE_URL!,
      apiKey: serverEnv.AI_API_KEY!,
      model: serverEnv.AI_MODEL!,
      maxOutputTokens: serverEnv.AI_STORY_DOCUMENT_MAX_OUTPUT_TOKENS,
      timeoutMs: serverEnv.AI_STORY_DOCUMENT_TIMEOUT_MS,
    })
  : disabledProvider()

const sharedPolicy = {
  enabled: serverEnv.AI_GATEWAY_ENABLED,
  maxRequestsPerSourceDay: serverEnv.AI_STORY_MAX_REQUESTS_PER_SOURCE_DAY,
  maxRequestsPerSession: serverEnv.AI_STORY_MAX_REQUESTS_PER_SESSION,
  cooldownSeconds: serverEnv.AI_STORY_COOLDOWN_SECONDS,
  dailyBudgetMicroUsd: serverEnv.AI_DAILY_BUDGET_MICRO_USD,
  inputMicroUsdPerMillionTokens: serverEnv.AI_INPUT_MICRO_USD_PER_MILLION_TOKENS,
  outputMicroUsdPerMillionTokens: serverEnv.AI_OUTPUT_MICRO_USD_PER_MILLION_TOKENS,
}

export const storyService = createStoryService({
  repository: createAiQuotaRepository(db),
  turnProvider,
  documentProvider,
  gate,
  providerName: 'openai-compatible',
  model: serverEnv.AI_MODEL ?? 'disabled',
  turnPolicy: {
    ...sharedPolicy,
    maxOutputTokens: serverEnv.AI_STORY_MAX_OUTPUT_TOKENS,
  },
  documentPolicy: {
    ...sharedPolicy,
    cooldownSeconds: 0,
    maxOutputTokens: serverEnv.AI_STORY_DOCUMENT_MAX_OUTPUT_TOKENS,
  },
})
