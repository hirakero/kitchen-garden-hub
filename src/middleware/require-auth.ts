import type { MiddlewareHandler } from 'hono'
import { createAuth } from '../lib/auth'
import type { AppType } from '../app'

export const setAuth: MiddlewareHandler<AppType> = async (c, next) => {
  c.set('auth', createAuth(c.env))
  await next()
}

export const requireAuth: MiddlewareHandler<AppType> = async (c, next) => {
  const session = await c.var.auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.redirect('/auth/login')
  if (session.user.email !== c.env.ALLOWED_EMAIL) return c.text('Forbidden', 403)
  c.set('user', session.user)
  c.set('session', session.session)
  await next()
}
