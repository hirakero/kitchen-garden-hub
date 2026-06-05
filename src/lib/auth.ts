import { betterAuth } from 'better-auth'
import type { Bindings } from '../app'

export const createAuth = (env: Bindings) =>
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

export type Auth = ReturnType<typeof createAuth>
