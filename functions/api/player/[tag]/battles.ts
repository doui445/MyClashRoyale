import { proxyToClashApi, type Env } from '../../../_shared/proxy'

export const onRequestGet: PagesFunction<Env> = async ({ params, env, request }) => {
  const tag = String(params.tag).replace(/^#/, '').toUpperCase()
  return proxyToClashApi(env, `/players/%23${tag}/battlelog`, request)
}
