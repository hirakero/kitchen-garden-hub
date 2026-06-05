import { Hono } from 'hono'
import type { AppType } from '../app'
import { LoginPage } from '../views/auth/login'
import { getMigrations } from 'better-auth/db/migration'

const route = new Hono<AppType>()

route.get('/login', (c) => {
  return c.html(<LoginPage />)
})

// One-time migration endpoint — remove after running once in each environment
route.post('/migrate', async (c) => {
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
