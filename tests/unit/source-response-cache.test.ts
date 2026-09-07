import { expect, it } from 'vitest'
import { publicSourceResponse } from '@/modules/home/response-cache'

it('revalidates identical public source but sends changed published content', async () => {
  const request = new Request('https://keleoz.com/reference/test')
  const headers = { 'cache-control': 'no-cache' }
  const first = publicSourceResponse('original public HTML', request, headers)
  const cached = new Request(request, { headers: { 'if-none-match': 'W/' + first.headers.get('etag') } })
  const same = publicSourceResponse('original public HTML', cached, headers)
  expect(same.status).toBe(304)
  expect(await same.text()).toBe('')
  const changed = publicSourceResponse('updated published appearance', cached, headers)
  expect(changed.status).toBe(200)
  expect(changed.headers.get('etag')).not.toBe(first.headers.get('etag'))
  expect(changed.headers.get('cache-control')).toBe('no-cache')
})
