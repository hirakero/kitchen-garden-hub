import { Hono } from 'hono'
import type { Auth } from './lib/auth'
import { setAuth, requireAuth } from './middleware/require-auth'
import dashboardRoute from './routes/index'
import authRoute from './routes/auth'
import spotsRoute from './routes/spots'
import plantingsRoute from './routes/plantings'
import tasksRoute from './routes/tasks'
import checkpointsRoute from './routes/checkpoints'
import settingsRoute from './routes/settings'

export type Bindings = {
  DB: D1Database
  APP_URL: string
  ALLOWED_EMAIL: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  BETTER_AUTH_SECRET: string
  VAPID_PUBLIC_KEY: string
  VAPID_PRIVATE_KEY: string
  VAPID_SUBJECT: string
}

export type Variables = {
  auth: Auth
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

app.use('*', setAuth)

// better-auth handler (unprotected)
app.on(['GET', 'POST'], '/api/auth/*', (c) => c.var.auth.handler(c.req.raw))

// unprotected: /auth/* (login page)
app.route('/auth', authRoute)

// protected routes — requireAuth applies once to everything mounted below,
// so new route modules don't need their own middleware registration
const protectedRoutes = new Hono<AppType>()
protectedRoutes.use('*', requireAuth)
protectedRoutes.route('/', dashboardRoute)
protectedRoutes.route('/spots', spotsRoute)
protectedRoutes.route('/plantings', plantingsRoute)
protectedRoutes.route('/tasks', tasksRoute)
protectedRoutes.route('/checkpoints', checkpointsRoute)
protectedRoutes.route('/settings', settingsRoute)

app.route('/', protectedRoutes)
