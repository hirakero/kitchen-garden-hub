import { betterAuth } from 'better-auth'
import type { Bindings } from '../app'

const _makeAuth = (env: Bindings) =>
  betterAuth({
    database: env.DB,
    baseURL: env.APP_URL,
    secret: env.BETTER_AUTH_SECRET,
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
  })

export type Auth = ReturnType<typeof _makeAuth>

// Cache per D1 binding so the same isolate reuses one auth instance across requests
const cache = new WeakMap<D1Database, Auth>()

export const createAuth = (env: Bindings): Auth => {
  const hit = cache.get(env.DB)
  if (hit) return hit
  const auth = _makeAuth(env)
  cache.set(env.DB, auth)
  return auth
}
