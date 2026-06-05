import { Hono } from 'hono'
import type { AppType } from '../app'
import { Layout } from '../views/layouts/base'
import { DashboardPage } from '../views/dashboard'

const route = new Hono<AppType>()

route.get('/', (c) => {
  return c.html(
    <Layout title="ダッシュボード">
      <DashboardPage />
    </Layout>
  )
})

export default route
