import { Hono } from 'hono'
import { eq, and, isNull, asc } from 'drizzle-orm'
import type { AppType } from '../app'
import { getDb } from '../db'
import {
  checkpointMaster,
  plantings,
  plantingCheckpointLogs,
  plantingTaskSchedules,
  stageMaster,
  taskMaster,
  vegetableMaster,
} from '../db/schema'
import { CheckpointConfirmModal } from '../views/partials/checkpoint-confirm-modal'

const route = new Hono<AppType>()

route.get('/:id/confirm', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id
  const checkpointId = Number(c.req.param('id'))
  const plantingId = Number(c.req.query('plantingId'))

  const cp = await db
    .select({ id: checkpointMaster.id, stageId: checkpointMaster.stageId })
    .from(checkpointMaster)
    .where(eq(checkpointMaster.id, checkpointId))
    .get()

  const planting = await db
    .select({
      id: plantings.id,
      vegetableId: plantings.vegetableId,
      vegetableName: vegetableMaster.name,
      currentStageId: plantings.currentStageId,
    })
    .from(plantings)
    .innerJoin(vegetableMaster, eq(plantings.vegetableId, vegetableMaster.id))
    .where(and(eq(plantings.id, plantingId), eq(plantings.userId, userId)))
    .get()

  if (!cp || !planting) return c.notFound()

  const allStages = await db
    .select({ id: stageMaster.id, name: stageMaster.name, orderIndex: stageMaster.orderIndex })
    .from(stageMaster)
    .where(eq(stageMaster.vegetableId, planting.vegetableId))
    .orderBy(asc(stageMaster.orderIndex))

  const currentStageName = allStages.find((s) => s.id === cp.stageId)?.name ?? '—'
  const currentIdx = allStages.findIndex((s) => s.id === cp.stageId)
  const nextStage = currentIdx >= 0 && currentIdx < allStages.length - 1 ? allStages[currentIdx + 1] : null

  return c.html(
    <CheckpointConfirmModal
      checkpointId={checkpointId}
      plantingId={plantingId}
      vegetableName={planting.vegetableName}
      currentStageName={currentStageName}
      nextStageName={nextStage?.name ?? null}
    />
  )
})

route.post('/:id/complete', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id
  const checkpointId = Number(c.req.param('id'))
  const plantingId = Number(c.req.query('plantingId'))

  const planting = await db
    .select()
    .from(plantings)
    .where(and(eq(plantings.id, plantingId), eq(plantings.userId, userId)))
    .get()
  if (!planting) return c.notFound()

  const cp = await db
    .select({ id: checkpointMaster.id, stageId: checkpointMaster.stageId })
    .from(checkpointMaster)
    .where(eq(checkpointMaster.id, checkpointId))
    .get()

  // Verify this checkpoint belongs to the planting's current stage
  if (!cp || cp.stageId !== planting.currentStageId) {
    return c.text('Bad Request', 400)
  }

  // Record checkpoint completion
  await db.insert(plantingCheckpointLogs).values({ plantingId, checkpointMasterId: checkpointId })

  // Find next stage
  const allStages = await db
    .select({ id: stageMaster.id, orderIndex: stageMaster.orderIndex })
    .from(stageMaster)
    .where(eq(stageMaster.vegetableId, planting.vegetableId))
    .orderBy(asc(stageMaster.orderIndex))

  const currentIdx = allStages.findIndex((s) => s.id === planting.currentStageId)
  const nextStage = currentIdx >= 0 && currentIdx < allStages.length - 1 ? allStages[currentIdx + 1] : null

  // Delete all uncompleted/unskipped task schedules (previous stage cleanup)
  await db
    .delete(plantingTaskSchedules)
    .where(
      and(
        eq(plantingTaskSchedules.plantingId, plantingId),
        isNull(plantingTaskSchedules.completedAt),
        isNull(plantingTaskSchedules.skippedAt),
      )
    )

  if (nextStage) {
    await db.update(plantings).set({ currentStageId: nextStage.id }).where(eq(plantings.id, plantingId))
    await generateTaskSchedules(db, plantingId, nextStage.id)
  } else {
    // Final stage completed — finish the planting
    await db.update(plantings).set({ currentStageId: null, finishedAt: new Date() }).where(eq(plantings.id, plantingId))
  }

  // Full page reload via htmx redirect
  c.header('HX-Redirect', `/plantings/${plantingId}`)
  return c.body(null, 200)
})

export default route

// ----------------------------------------------------------------
// Shared helper: generate task schedules for a stage starting today
// Recurring: generate rows for next 60 days; One-time: single row
// ----------------------------------------------------------------
export async function generateTaskSchedules(
  db: ReturnType<typeof getDb>,
  plantingId: number,
  stageId: number,
) {
  const tasks = await db.select().from(taskMaster).where(eq(taskMaster.stageId, stageId))

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const DAYS_AHEAD = 60

  const schedules: { plantingId: number; taskMasterId: number; scheduledDate: Date }[] = []

  for (const task of tasks) {
    if (task.taskType === 'one_time') {
      const d = new Date(today)
      d.setDate(today.getDate() + (task.daysFromStageStart ?? 0))
      schedules.push({ plantingId, taskMasterId: task.id, scheduledDate: d })
    } else if (task.taskType === 'recurring' && task.intervalDays) {
      for (let offset = 0; offset <= DAYS_AHEAD; offset += task.intervalDays) {
        const d = new Date(today)
        d.setDate(today.getDate() + offset)
        schedules.push({ plantingId, taskMasterId: task.id, scheduledDate: d })
      }
    }
  }

  if (schedules.length > 0) {
    await db.insert(plantingTaskSchedules).values(schedules)
  }
}
