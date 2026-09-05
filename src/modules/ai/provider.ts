import { z } from 'zod'

export type AiMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export class AiProviderError extends Error {
  constructor(public readonly code: 'upstream_error' | 'invalid_response' | 'output_truncated' | 'cancelled' | 'timeout') {
    super(code)
    this.name = 'AiProviderError'
  }
}

const providerResponseSchema = z.object({
  id: z.string().min(1),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(z.object({
    index: z.number(),
    message: z.object({
      role: z.literal('assistant'),
      content: z.string().nullable(),
    }),
    finish_reason: z.string().nullable(),
  })).min(1),
  usage: z.object({
    prompt_tokens: z.number().int().nonnegative(),
    completion_tokens: z.number().int().nonnegative(),
    total_tokens: z.number().int().nonnegative(),
  }),
})

export function createOpenAiCompatibleProvider(config: {
  baseUrl: string
  apiKey: string
  model: string
  maxOutputTokens: number
  timeoutMs: number
  fetcher?: typeof fetch
}) {
  const endpoint = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`
  const fetcher = config.fetcher ?? fetch

  return {
    async complete(messages: AiMessage[],signal?:AbortSignal) {
      const deadline=AbortSignal.timeout(config.timeoutMs)
      const upstreamSignal=signal?AbortSignal.any([signal,deadline]):deadline
      const failure=()=>new AiProviderError(signal?.aborted?'cancelled':deadline.aborted?'timeout':'upstream_error')
      let response: Response
      try {
        response = await fetcher(endpoint, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            authorization: `Bearer ${config.apiKey}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: config.model,
            messages,
            max_tokens: config.maxOutputTokens,
            stream: false,
          }),
          signal: upstreamSignal,
        })
      } catch {
        throw failure()
      }

      if (!response.ok) throw new AiProviderError('upstream_error')

      let body: unknown
      try {
        body = await response.json()
      } catch {
        if(upstreamSignal.aborted)throw failure()
        throw new AiProviderError('invalid_response')
      }
      const parsed = providerResponseSchema.safeParse(body)
      if (!parsed.success) throw new AiProviderError('invalid_response')
      const choice=parsed.data.choices[0]!
      if(!choice.message.content?.trim()&&choice.finish_reason!=='length')throw new AiProviderError('invalid_response')

      return {
        content: choice.message.content??'',
        truncated: parsed.data.choices[0]!.finish_reason === 'length',
        providerRequestId: parsed.data.id,
        promptTokens: parsed.data.usage.prompt_tokens,
        completionTokens: parsed.data.usage.completion_tokens,
      }
    },
  }
}
