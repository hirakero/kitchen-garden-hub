import { Hono } from 'hono'
import { eq, and, isNull } from 'drizzle-orm'
import type { AppType } from '../app'
import { getDb } from '../db'
import { plantingTaskSchedules, plantings } from '../db/schema'
import { TaskList } from '../views/partials/task-list'
import { fetchTaskGroups } from './index'

const route = new Hono<AppType>()

// htmx: タスク完了チェック → task-list を再描画 (hx-target="#task-list" hx-swap="outerHTML")
route.post('/:id/complete', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id
  const id = Number(c.req.param('id'))

  if (!Number.isInteger(id) || id <= 0) return c.text('Bad Request', 400)

  const schedule = await db
    .select({ id: plantingTaskSchedules.id, completedAt: plantingTaskSchedules.completedAt })
    .from(plantingTaskSchedules)
    .innerJoin(plantings, eq(plantingTaskSchedules.plantingId, plantings.id))
    .where(and(eq(plantingTaskSchedules.id, id), eq(plantings.userId, userId)))
    .get()

  if (!schedule) return c.notFound()

  // Idempotent: already completed → just return fresh list
  if (!schedule.completedAt) {
    await db
      .update(plantingTaskSchedules)
      .set({ completedAt: new Date() })
      .where(and(eq(plantingTaskSchedules.id, id), isNull(plantingTaskSchedules.completedAt)))
  }

  const groups = await fetchTaskGroups(db, userId)
  return c.html(<TaskList groups={groups} />)
})

// htmx: 過去の one_time タスクをスキップ → task-list を再描画
route.post('/:id/skip', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id
  const id = Number(c.req.param('id'))

  if (!Number.isInteger(id) || id <= 0) return c.text('Bad Request', 400)

  const schedule = await db
    .select({ id: plantingTaskSchedules.id, skippedAt: plantingTaskSchedules.skippedAt })
    .from(plantingTaskSchedules)
    .innerJoin(plantings, eq(plantingTaskSchedules.plantingId, plantings.id))
    .where(and(eq(plantingTaskSchedules.id, id), eq(plantings.userId, userId)))
    .get()

  if (!schedule) return c.notFound()

  if (!schedule.skippedAt) {
    await db
      .update(plantingTaskSchedules)
      .set({ skippedAt: new Date() })
      .where(and(eq(plantingTaskSchedules.id, id), isNull(plantingTaskSchedules.skippedAt)))
  }

  const groups = await fetchTaskGroups(db, userId)
  return c.html(<TaskList groups={groups} />)
})

export default route
