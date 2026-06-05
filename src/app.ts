import { Hono } from 'hono'

export type Bindings = {
  DB: D1Database
  ALLOWED_EMAIL: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  BETTER_AUTH_SECRET: string
  VAPID_PUBLIC_KEY: string
  VAPID_PRIVATE_KEY: string
  VAPID_SUBJECT: string
}

export type Variables = {
  user: {
    id: string
    email: string
    name: string
    emailVerified: boolean
    image?: string | null
    createdAt: Date
    updatedAt: Date
  }
  session: {
    id: string
    userId: string
    token: string
    expiresAt: Date
    ipAddress?: string | null
    userAgent?: string | null
    createdAt: Date
    updatedAt: Date
  }
}

export type AppType = { Bindings: Bindings; Variables: Variables }

export const app = new Hono<AppType>()
