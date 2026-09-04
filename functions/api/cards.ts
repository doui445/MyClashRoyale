import { proxyToClashApi, type Env } from '../_shared/proxy'

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) =>
  proxyToClashApi(env, '/cards', request)
