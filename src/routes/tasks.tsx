import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import type { AppType } from '../app'
import { getDb } from '../db'
import { plantingTaskSchedules, plantings } from '../db/schema'
import { TaskList } from '../views/partials/task-list'
import { fetchTaskGroups } from './index'

const route = new Hono<AppType>()

// htmx: タスク完了チェック → task-list を再描画
route.post('/:id/complete', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id
  const id = Number(c.req.param('id'))

  if (!Number.isInteger(id) || id <= 0) return c.text('Bad Request', 400)

  // Verify the task belongs to this user before updating
  const schedule = await db
    .select({ id: plantingTaskSchedules.id })
    .from(plantingTaskSchedules)
    .innerJoin(plantings, eq(plantingTaskSchedules.plantingId, plantings.id))
    .where(and(eq(plantingTaskSchedules.id, id), eq(plantings.userId, userId)))
    .get()

  if (!schedule) return c.notFound()

  await db
    .update(plantingTaskSchedules)
    .set({ completedAt: new Date() })
    .where(eq(plantingTaskSchedules.id, id))

  const groups = await fetchTaskGroups(db, userId)
  return c.html(<TaskList groups={groups} />)
})

export default route
