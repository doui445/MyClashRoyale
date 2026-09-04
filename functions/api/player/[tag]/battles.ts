import { proxyToClashApi, isValidRelayTag, notFoundResponse, type Env } from '../../../_shared/proxy'

export const onRequestGet: PagesFunction<Env> = async ({ params, env, request }) => {
  const tag = String(params.tag).replace(/^#/, '').toUpperCase()
  if (!isValidRelayTag(tag)) return notFoundResponse(env)
  return proxyToClashApi(env, `/players/%23${tag}/battlelog`, request)
}
