import { Hono } from 'hono'
import type { AppType } from '../app'
import { TaskList } from '../views/partials/task-list'

const route = new Hono<AppType>()

// HTMX: タスク完了 → task-list を再描画
route.post('/:id/complete', async (c) => {
  // TODO: DB update completed_at
  return c.html(<TaskList />)
})

export default route
