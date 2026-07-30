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
import { buildTaskSchedules } from '../lib/task-scheduler'
import { positiveInt } from '../lib/params'
import { hxRedirect } from '../lib/htmx'
import { CheckpointConfirmModal } from '../views/partials/checkpoint-confirm-modal'

const route = new Hono<AppType>()

// completedAt/skippedAt が両方未設定の予定行 = ステージ進行時に削除される予定のタスク
const pendingScheduleCondition = (plantingId: number) =>
  and(
    eq(plantingTaskSchedules.plantingId, plantingId),
    isNull(plantingTaskSchedules.completedAt),
    isNull(plantingTaskSchedules.skippedAt),
  )

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
    .select({
      id: stageMaster.id,
      name: stageMaster.name,
      orderIndex: stageMaster.orderIndex,
      isOngoing: stageMaster.isOngoing,
    })
    .from(stageMaster)
    .where(eq(stageMaster.vegetableId, planting.vegetableId))
    .orderBy(asc(stageMaster.orderIndex))

  const currentIdx = allStages.findIndex((s) => s.id === cp.stageId)
  const currentStage = currentIdx >= 0 ? allStages[currentIdx] : undefined
  const nextStage = currentIdx >= 0 && currentIdx < allStages.length - 1 ? allStages[currentIdx + 1] : null

  // Perennial stage (e.g. ニラ's 収穫期（多年草）) with no next stage — this checkpoint just
  // records a seasonal milestone, nothing gets deleted or finished
  const isOngoingRenewal = nextStage === null && (currentStage?.isOngoing ?? false)

  let pendingTaskNames: string[] = []
  if (!isOngoingRenewal) {
    const pending = await db
      .selectDistinct({ name: taskMaster.name })
      .from(plantingTaskSchedules)
      .innerJoin(taskMaster, eq(plantingTaskSchedules.taskMasterId, taskMaster.id))
      .where(pendingScheduleCondition(plantingId))
    pendingTaskNames = pending.map((p) => p.name)
  }

  return c.html(
    <CheckpointConfirmModal
      checkpointId={checkpointId}
      plantingId={plantingId}
      vegetableName={planting.vegetableName}
      currentStageName={currentStage?.name ?? '—'}
      nextStageName={nextStage?.name ?? null}
      isOngoing={isOngoingRenewal}
      pendingTaskNames={pendingTaskNames}
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
    return hxRedirect(c, `/plantings/${plantingId}`)
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
    return hxRedirect(c, `/plantings/${plantingId}`)
  }

  const allStages = await db
    .select({ id: stageMaster.id, orderIndex: stageMaster.orderIndex, isOngoing: stageMaster.isOngoing })
    .from(stageMaster)
    .where(eq(stageMaster.vegetableId, planting.vegetableId))
    .orderBy(asc(stageMaster.orderIndex))

  const currentIdx = allStages.findIndex((s) => s.id === planting.currentStageId)
  const currentStage = currentIdx >= 0 ? allStages[currentIdx] : undefined
  const nextStage = currentIdx >= 0 && currentIdx < allStages.length - 1 ? allStages[currentIdx + 1] : null

  // Perennial stage with no next stage: just log the milestone. The planting stays active with
  // its current (unchanged) stage, and its recurring schedules are topped up separately
  // (lib/task-scheduler.topUpOngoingSchedules) since no further checkpoint will ever fire here.
  if (!nextStage && currentStage?.isOngoing) {
    await db.insert(plantingCheckpointLogs).values({ plantingId, checkpointMasterId: checkpointId })
    return hxRedirect(c, `/plantings/${plantingId}`)
  }

  // Compute the next stage's schedule rows up front so the whole state transition
  // (drop old schedules, advance stage, log checkpoint, seed new schedules) commits
  // atomically — a partial failure must never leave the checkpoint logged with no
  // schedules generated for the stage it just advanced into.
  const newSchedules = nextStage ? await buildTaskSchedules(db, plantingId, nextStage.id) : []

  const deleteStaleSchedules = db.delete(plantingTaskSchedules).where(pendingScheduleCondition(plantingId))

  const advanceStage = nextStage
    ? db.update(plantings).set({ currentStageId: nextStage.id }).where(eq(plantings.id, plantingId))
    : db.update(plantings).set({ currentStageId: null, finishedAt: new Date() }).where(eq(plantings.id, plantingId))

  const logCheckpoint = db
    .insert(plantingCheckpointLogs)
    .values({ plantingId, checkpointMasterId: checkpointId })

  if (newSchedules.length > 0) {
    await db.batch([
      deleteStaleSchedules,
      advanceStage,
      logCheckpoint,
      db.insert(plantingTaskSchedules).values(newSchedules),
    ])
  } else {
    await db.batch([deleteStaleSchedules, advanceStage, logCheckpoint])
  }

  return hxRedirect(c, `/plantings/${plantingId}`)
})

export default route
