import { Hono } from 'hono'
import { eq, and, isNull } from 'drizzle-orm'
import type { Context } from 'hono'
import type { AppType } from '../app'
import { getDb } from '../db'
import { plantingTaskSchedules, plantings } from '../db/schema'
import { fetchTaskGroups } from '../lib/task-groups'
import { positiveInt } from '../lib/params'
import { TaskList } from '../views/partials/task-list'

const route = new Hono<AppType>()

// complete と skip は「本人のタスクに冪等でタイムスタンプを打ち、task-list を再描画」まで共通
async function markSchedule(c: Context<AppType>, column: 'completedAt' | 'skippedAt') {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id
  const id = positiveInt(c.req.param('id'))

  if (id === null) return c.text('Bad Request', 400)

  const schedule = await db
    .select({ id: plantingTaskSchedules.id, markedAt: plantingTaskSchedules[column] })
    .from(plantingTaskSchedules)
    .innerJoin(plantings, eq(plantingTaskSchedules.plantingId, plantings.id))
    .where(and(eq(plantingTaskSchedules.id, id), eq(plantings.userId, userId)))
    .get()

  if (!schedule) return c.notFound()

  // Idempotent: already marked → just return fresh list
  if (!schedule.markedAt) {
    await db
      .update(plantingTaskSchedules)
      .set({ [column]: new Date() })
      .where(and(eq(plantingTaskSchedules.id, id), isNull(plantingTaskSchedules[column])))
  }

  const groups = await fetchTaskGroups(db, userId)
  return c.html(<TaskList groups={groups} />)
}

// htmx: タスク完了チェック → task-list を再描画 (hx-target="#task-list" hx-swap="outerHTML")
route.post('/:id/complete', (c) => markSchedule(c, 'completedAt'))

// htmx: 過去の one_time タスクをスキップ → task-list を再描画
route.post('/:id/skip', (c) => markSchedule(c, 'skippedAt'))

export default route
