import { describe, it, expect, vi, afterEach } from 'vitest'
import { proxyToClashApi, type Env } from './proxy'

const env: Env = { CLASH_API_TOKEN: 'secret-xyz', APP_ORIGIN: 'https://app.test' }
const req = new Request('https://app.test/api/player/ABC')

afterEach(() => vi.unstubAllGlobals())

function stubFetch(status: number, body: unknown) {
  const spy = vi.fn(async () =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }),
  )
  vi.stubGlobal('fetch', spy)
  return spy
}

describe('proxyToClashApi', () => {
  it('appelle le proxy RoyaleAPI avec le token et renvoie le corps', async () => {
    const spy = stubFetch(200, { tag: '#ABC', name: 'Test' })
    const res = await proxyToClashApi(env, '/players/%23ABC', req)
    expect(spy).toHaveBeenCalledWith(
      'https://proxy.royaleapi.com/v1/players/%23ABC',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer secret-xyz',
        }),
      }),
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('access-control-allow-origin')).toBe('https://app.test')
    expect(await res.json()).toEqual({ tag: '#ABC', name: 'Test' })
  })

  it('utilise CLASH_API_BASE quand il est défini (appel direct en local)', async () => {
    const spy = stubFetch(200, [])
    await proxyToClashApi({ ...env, CLASH_API_BASE: 'https://api.clashroyale.com/v1' }, '/cards', req)
    expect(spy).toHaveBeenCalledWith('https://api.clashroyale.com/v1/cards', expect.anything())
  })

  it('mappe 404 amont en { error: "NOT_FOUND" }', async () => {
    stubFetch(404, { reason: 'notFound' })
    const res = await proxyToClashApi(env, '/players/%23NOPE', req)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'NOT_FOUND' })
  })

  it('mappe 503 amont en { error: "MAINTENANCE" }', async () => {
    stubFetch(503, {})
    const res = await proxyToClashApi(env, '/players/x', req)
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ error: 'MAINTENANCE' })
  })

  it('capture les erreurs réseau thrown et retourne 502 { error: "UPSTREAM_ERROR" }', async () => {
    const spy = vi.fn(async () => {
      throw new TypeError('network error')
    })
    vi.stubGlobal('fetch', spy)
    const res = await proxyToClashApi(env, '/players/%23ABC', req)
    expect(res.status).toBe(502)
    expect(res.headers.get('access-control-allow-origin')).toBe('https://app.test')
    expect(await res.json()).toEqual({ error: 'UPSTREAM_ERROR' })
  })
})
