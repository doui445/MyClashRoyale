import { describe, it, expect, vi, afterEach } from 'vitest'
import { onRequestGet as battlesGet } from './player/[tag]/battles'
import { onRequestGet as playerGet } from './player/[tag]'
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
    await battlesGet(ctx({ tag: 'lqv' }))
    expect(spy).toHaveBeenCalledWith('https://api.clashroyale.com/v1/players/%23LQV/battlelog', expect.anything())
  })

  it('cards → /cards', async () => {
    const spy = stubFetch()
    await cardsGet(ctx({}))
    expect(spy).toHaveBeenCalledWith('https://api.clashroyale.com/v1/cards', expect.anything())
  })

  it('rejette un tag hors alphabet (tentative de traversée de chemin) sans jamais appeler fetch', async () => {
    const spy = stubFetch()
    const res = await playerGet(ctx({ tag: '..%2F..%2Fclans' }))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'NOT_FOUND' })
    expect(spy).not.toHaveBeenCalled()
  })

  it('rejette un tag hors alphabet sur la route battles sans jamais appeler fetch', async () => {
    const spy = stubFetch()
    const res = await battlesGet(ctx({ tag: 'lowercase/slash' }))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'NOT_FOUND' })
    expect(spy).not.toHaveBeenCalled()
  })
})
