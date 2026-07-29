import { Hono } from 'hono'
import type { AppType } from '../app'
import { Layout } from '../views/layouts/base'
import { SettingsPage } from '../views/settings'

const route = new Hono<AppType>()

route.get('/', (c) => {
  return c.html(
    <Layout title="設定">
      <SettingsPage email={c.var.user.email} />
    </Layout>
  )
})

export default route
