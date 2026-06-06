import { Hono } from 'hono'
import type { AppType } from '../app'
import { LoginPage } from '../views/auth/login'
import { getMigrations } from 'better-auth/db/migration'

const route = new Hono<AppType>()

route.get('/login', async (c) => {
  const session = await c.var.auth.api.getSession({ headers: c.req.raw.headers })
  if (session && session.user.email === c.env.ALLOWED_EMAIL) {
    return c.redirect('/')
  }
  const error = c.req.query('error') ?? null
  return c.html(<LoginPage error={error} />)
})

// One-time migration endpoint — remove after running once in each environment
// Protected by BETTER_AUTH_SECRET bearer token
route.post('/migrate', async (c) => {
  const auth = c.req.header('Authorization')
  if (auth !== `Bearer ${c.env.BETTER_AUTH_SECRET}`) {
    return c.text('Unauthorized', 401)
  }
  try {
    const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(c.var.auth.options)
    if (toBeCreated.length === 0 && toBeAdded.length === 0) {
      return c.json({ message: 'No migrations needed' })
    }
    await runMigrations()
    return c.json({
      message: 'Migrations completed',
      created: toBeCreated.map((t) => t.table),
      added: toBeAdded.map((t) => t.table),
    })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Migration failed' }, 500)
  }
})

export default route
