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
  vegetableMaster,
} from '../db/schema'
import { generateTaskSchedules } from '../lib/task-scheduler'
import { positiveInt } from '../lib/params'
import { CheckpointConfirmModal } from '../views/partials/checkpoint-confirm-modal'

const route = new Hono<AppType>()

route.get('/:id/confirm', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id
  const checkpointId = positiveInt(c.req.param('id'))
  const plantingId = positiveInt(c.req.query('plantingId'))

  if (checkpointId === null || plantingId === null) {
    return c.text('Bad Request', 400)
  }

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

  // Confirm checkpoint belongs to the planting's current stage
  if (cp.stageId !== planting.currentStageId) return c.notFound()

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
  const checkpointId = positiveInt(c.req.param('id'))
  const plantingId = positiveInt(c.req.query('plantingId'))

  if (checkpointId === null || plantingId === null) {
    return c.text('Bad Request', 400)
  }

  const planting = await db
    .select({
      id: plantings.id,
      vegetableId: plantings.vegetableId,
      currentStageId: plantings.currentStageId,
      finishedAt: plantings.finishedAt,
    })
    .from(plantings)
    .where(and(eq(plantings.id, plantingId), eq(plantings.userId, userId)))
    .get()

  if (!planting) return c.notFound()

  // Already finished — redirect idempotently
  if (planting.finishedAt) {
    c.header('HX-Redirect', `/plantings/${plantingId}`)
    return c.body(null, 200)
  }

  const cp = await db
    .select({ id: checkpointMaster.id, stageId: checkpointMaster.stageId })
    .from(checkpointMaster)
    .where(eq(checkpointMaster.id, checkpointId))
    .get()

  if (!cp || cp.stageId !== planting.currentStageId) {
    return c.text('Bad Request', 400)
  }

  // Idempotency: if already logged, redirect without side effects
  const existing = await db
    .select({ id: plantingCheckpointLogs.id })
    .from(plantingCheckpointLogs)
    .where(and(
      eq(plantingCheckpointLogs.plantingId, plantingId),
      eq(plantingCheckpointLogs.checkpointMasterId, checkpointId),
    ))
    .get()

  if (existing) {
    c.header('HX-Redirect', `/plantings/${plantingId}`)
    return c.body(null, 200)
  }

  const allStages = await db
    .select({ id: stageMaster.id, orderIndex: stageMaster.orderIndex })
    .from(stageMaster)
    .where(eq(stageMaster.vegetableId, planting.vegetableId))
    .orderBy(asc(stageMaster.orderIndex))

  const currentIdx = allStages.findIndex((s) => s.id === planting.currentStageId)
  const nextStage = currentIdx >= 0 && currentIdx < allStages.length - 1 ? allStages[currentIdx + 1] : null

  // Delete uncompleted/unskipped task schedules from the previous stage
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
  } else {
    await db.update(plantings).set({ currentStageId: null, finishedAt: new Date() }).where(eq(plantings.id, plantingId))
  }

  // Log inserted last as the commit point — earlier steps can be safely retried if they failed
  await db.insert(plantingCheckpointLogs).values({ plantingId, checkpointMasterId: checkpointId })

  if (nextStage) {
    await generateTaskSchedules(db, plantingId, nextStage.id)
  }

  c.header('HX-Redirect', `/plantings/${plantingId}`)
  return c.body(null, 200)
})

export default route
