import type { MiddlewareHandler } from 'hono'
import { createAuth } from '../lib/auth'
import type { AppType } from '../app'

export const setAuth: MiddlewareHandler<AppType> = async (c, next) => {
  if (!c.env.ALLOWED_EMAIL) throw new Error('ALLOWED_EMAIL is not configured')
  c.set('auth', createAuth(c.env))
  await next()
}

export const requireAuth: MiddlewareHandler<AppType> = async (c, next) => {
  if (!c.var.auth) return c.redirect('/auth/login')
  const session = await c.var.auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.redirect('/auth/login')
  if (session.user.email !== c.env.ALLOWED_EMAIL) {
    return c.redirect('/auth/login?error=forbidden')
  }
  c.set('user', session.user)
  c.set('session', session.session)
  await next()
}
