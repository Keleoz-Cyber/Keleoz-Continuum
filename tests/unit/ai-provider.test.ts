import { describe, expect, it } from 'vitest'

import { AiProviderError, createOpenAiCompatibleProvider } from '@/modules/ai/provider'

const messages = [
  { role: 'system' as const, content: 'Site-owned prompt' },
  { role: 'user' as const, content: 'Still here?' },
]

describe('OpenAI-compatible provider adapter', () => {
  it('retains usage when thinking exhausts the output budget before final text',async()=>{
    const provider=createOpenAiCompatibleProvider({baseUrl:'https://provider.example',apiKey:'test',model:'test',maxOutputTokens:320,timeoutMs:1000,fetcher:async()=>Response.json({id:'reasoning-only',object:'chat.completion',created:1,model:'test',choices:[{index:0,message:{role:'assistant',content:null},finish_reason:'length'}],usage:{prompt_tokens:30,completion_tokens:320,total_tokens:350}})})
    await expect(provider.complete(messages)).resolves.toMatchObject({content:'',truncated:true,completionTokens:320})
  })
  it('keeps credentials server-side and parses the complete chat response contract', async () => {
    let observed: { url: string; init?: RequestInit } | undefined
    const fetcher: typeof fetch = async (input, init) => {
      observed = { url: String(input), init }
      return Response.json({
        id: 'chatcmpl-test',
        object: 'chat.completion',
        created: 1_777_777,
        model: 'provider-model',
        choices: [{ index: 0, message: { role: 'assistant', content: 'I am still here.' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 21, completion_tokens: 8, total_tokens: 29 },
      })
    }
    const provider = createOpenAiCompatibleProvider({
      baseUrl: 'https://provider.example/v1/',
      apiKey: 'server-secret',
      model: 'provider-model',
      maxOutputTokens: 320,
      timeoutMs: 30_000,
      fetcher,
    })

    await expect(provider.complete(messages)).resolves.toEqual({
      content: 'I am still here.',
      truncated: false,
      providerRequestId: 'chatcmpl-test',
      promptTokens: 21,
      completionTokens: 8,
    })
    expect(observed?.url).toBe('https://provider.example/v1/chat/completions')
    expect(new Headers(observed?.init?.headers).get('authorization')).toBe('Bearer server-secret')
    expect(JSON.parse(String(observed?.init?.body))).toMatchObject({
      model: 'provider-model',
      messages,
      max_tokens: 320,
      stream: false,
    })
  })

  it('reports length truncation so Story can continue a long design document', async () => {
    const provider = createOpenAiCompatibleProvider({
      baseUrl: 'https://provider.example/v1',
      apiKey: 'server-secret',
      model: 'provider-model',
      maxOutputTokens: 8_192,
      timeoutMs: 90_000,
      fetcher: async () => Response.json({
        id: 'chatcmpl-story-doc',
        object: 'chat.completion',
        created: 1_777_777,
        model: 'provider-model',
        choices: [{ index: 0, message: { role: 'assistant', content: '第一段' }, finish_reason: 'length' }],
        usage: { prompt_tokens: 50, completion_tokens: 8_192, total_tokens: 8_242 },
      }),
    })

    await expect(provider.complete(messages)).resolves.toMatchObject({ content: '第一段', truncated: true })
  })

  it('preserves provider whitespace across Story document segments', async () => {
    const provider = createOpenAiCompatibleProvider({
      baseUrl: 'https://provider.example/v1', apiKey: 'server-secret', model: 'provider-model',
      maxOutputTokens: 8_192, timeoutMs: 90_000,
      fetcher: async () => Response.json({
        id: 'chatcmpl-whitespace', object: 'chat.completion', created: 1, model: 'provider-model',
        choices: [{ index: 0, message: { role: 'assistant', content: '\n第一段末尾\n\n' }, finish_reason: 'length' }],
        usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
      }),
    })

    await expect(provider.complete(messages)).resolves.toMatchObject({ content: '\n第一段末尾\n\n' })
  })

  it('turns provider failures and malformed bodies into safe typed errors', async () => {
    const failed = createOpenAiCompatibleProvider({
      baseUrl: 'https://provider.example/v1',
      apiKey: 'server-secret',
      model: 'provider-model',
      maxOutputTokens: 320,
      timeoutMs: 30_000,
      fetcher: async () => Response.json({ error: { message: 'secret upstream detail' } }, { status: 429 }),
    })
    const malformed = createOpenAiCompatibleProvider({
      baseUrl: 'https://provider.example/v1',
      apiKey: 'server-secret',
      model: 'provider-model',
      maxOutputTokens: 320,
      timeoutMs: 30_000,
      fetcher: async () => Response.json({
        id: 'chatcmpl-empty',
        object: 'chat.completion',
        created: 1_777_777,
        model: 'provider-model',
        choices: [],
        usage: { prompt_tokens: 1, completion_tokens: 0, total_tokens: 1 },
      }),
    })

    await expect(failed.complete(messages)).rejects.toMatchObject({ code: 'upstream_error' } satisfies Partial<AiProviderError>)
    await expect(malformed.complete(messages)).rejects.toMatchObject({ code: 'invalid_response' } satisfies Partial<AiProviderError>)
  })
})
