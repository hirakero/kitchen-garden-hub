import { Hono } from 'hono'
import type { AppType } from '../app'
import { LoginPage } from '../views/auth/login'

const route = new Hono<AppType>()

route.get('/login', (c) => {
  return c.html(<LoginPage />)
})

export default route
