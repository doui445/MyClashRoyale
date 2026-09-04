export interface Env {
  CLASH_API_TOKEN: string
  APP_ORIGIN: string
}

const UPSTREAM = 'https://proxy.royaleapi.com/v1'

const STATUS_TO_CODE: Record<number, string> = {
  404: 'NOT_FOUND',
  429: 'RATE_LIMITED',
  503: 'MAINTENANCE',
}

export async function proxyToClashApi(env: Env, apiPath: string, _request: Request): Promise<Response> {
  const cors = {
    'access-control-allow-origin': env.APP_ORIGIN,
    'access-control-allow-methods': 'GET, OPTIONS',
  }

  try {
    const upstream = await fetch(`${UPSTREAM}${apiPath}`, {
      headers: { Authorization: `Bearer ${env.CLASH_API_TOKEN}`, Accept: 'application/json' },
      cf: { cacheTtl: 60, cacheEverything: true },
    } as RequestInit)

    if (!upstream.ok) {
      const code = STATUS_TO_CODE[upstream.status] ?? 'UPSTREAM_ERROR'
      return new Response(JSON.stringify({ error: code }), {
        status: upstream.status,
        headers: { 'content-type': 'application/json', ...cors },
      })
    }

    const body = await upstream.text()
    return new Response(body, {
      status: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=60', ...cors },
    })
  } catch (_error) {
    return new Response(JSON.stringify({ error: 'UPSTREAM_ERROR' }), {
      status: 502,
      headers: { 'content-type': 'application/json', ...cors },
    })
  }
}
