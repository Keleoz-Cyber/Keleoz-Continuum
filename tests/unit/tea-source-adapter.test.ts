import { describe, expect, it } from 'vitest'

import { createTeaGatewayPayload } from '@/modules/tea/source-adapter'

describe('Tea immutable-source adapter', () => {
  it('strips the source-owned browser system prompt before the server request', () => {
    expect(createTeaGatewayPayload({
      sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17',
      drink: 'green',
      dessert: 'matcha',
      isNight: false,
      messages: [
        { role: 'system', content: 'Browser copy of the prompt' },
        { role: 'user', content: '陪我坐一会儿。' },
        { role: 'assistant', content: '好。' },
      ],
    })).toEqual({
      sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17',
      drink: 'green',
      dessert: 'matcha',
      isNight: false,
      messages: [
        { role: 'user', content: '陪我坐一会儿。' },
        { role: 'assistant', content: '好。' },
      ],
    })
  })

  it('refuses incomplete source state instead of inventing a combination', () => {
    expect(createTeaGatewayPayload({
      sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17',
      drink: null,
      dessert: 'matcha',
      isNight: false,
      messages: [{ role: 'user', content: 'hello' }],
    })).toBeNull()
  })
})
