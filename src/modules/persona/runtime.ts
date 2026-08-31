import 'server-only'

import { db } from '@/db/client'
import { AiProviderError, createOpenAiCompatibleProvider } from '@/modules/ai/provider'
import { createAiConcurrencyGate, getSharedAiConcurrencyGate } from '@/modules/ai/quota'
import { createAiQuotaRepository } from '@/modules/ai/repository'
import { createPersonaRepository } from '@/modules/persona/repository'
import { createPersonaGenerationService } from '@/modules/persona/service'
import { serverEnv } from '@/shared/env'

export const personaRepository = createPersonaRepository(db)

const runtimeGlobal = globalThis as typeof globalThis & {
  continuumAiGate?: ReturnType<typeof createAiConcurrencyGate>
}
const gate = getSharedAiConcurrencyGate(runtimeGlobal, serverEnv.AI_GLOBAL_MAX_CONCURRENCY)

const provider = serverEnv.AI_GATEWAY_ENABLED
  ? createOpenAiCompatibleProvider({
      baseUrl: serverEnv.AI_BASE_URL!,
      apiKey: serverEnv.AI_API_KEY!,
      model: serverEnv.AI_MODEL!,
      maxOutputTokens: serverEnv.AI_PERSONA_MAX_OUTPUT_TOKENS,
      timeoutMs: serverEnv.AI_TIMEOUT_MS,
    })
  : {
      async complete(): Promise<never> {
        throw new AiProviderError('upstream_error')
      },
    }

export const personaGenerationService = createPersonaGenerationService({
  personas: personaRepository,
  quota: createAiQuotaRepository(db),
  gate,
  provider,
  providerName: 'openai-compatible',
  model: serverEnv.AI_MODEL ?? 'disabled',
  maxOutputTokens: serverEnv.AI_PERSONA_MAX_OUTPUT_TOKENS,
  dailyBudgetMicroUsd: serverEnv.AI_DAILY_BUDGET_MICRO_USD,
  inputMicroUsdPerMillionTokens: serverEnv.AI_INPUT_MICRO_USD_PER_MILLION_TOKENS,
  outputMicroUsdPerMillionTokens: serverEnv.AI_OUTPUT_MICRO_USD_PER_MILLION_TOKENS,
})

export const personaAiEnabled = serverEnv.AI_GATEWAY_ENABLED
