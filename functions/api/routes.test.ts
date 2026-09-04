import { describe, it, expect, vi, afterEach } from 'vitest'
import { onRequestGet as battlesGet } from './player/[tag]/battles'
import { onRequestGet as cardsGet } from './cards'

const env = { CLASH_API_TOKEN: 't', APP_ORIGIN: 'https://app.test' }
afterEach(() => vi.unstubAllGlobals())

function stubFetch() {
  const spy = vi.fn(async () => new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }))
  vi.stubGlobal('fetch', spy)
  return spy
}

const ctx = (params: Record<string, string>) => ({
  params, env, request: new Request('https://app.test/'),
} as never)

describe('routes du relais', () => {
  it('battles → /players/%23TAG/battlelog', async () => {
    const spy = stubFetch()
    await battlesGet(ctx({ tag: 'abc' }))
    expect(spy).toHaveBeenCalledWith('https://proxy.royaleapi.com/v1/players/%23ABC/battlelog', expect.anything())
  })

  it('cards → /cards', async () => {
    const spy = stubFetch()
    await cardsGet(ctx({}))
    expect(spy).toHaveBeenCalledWith('https://proxy.royaleapi.com/v1/cards', expect.anything())
  })
})
