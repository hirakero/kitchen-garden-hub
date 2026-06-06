import { Hono } from 'hono'
import { eq, and, asc, desc, isNotNull, inArray } from 'drizzle-orm'
import type { AppType } from '../app'
import { getDb } from '../db'
import {
  plantings,
  vegetableMaster,
  spots,
  stageMaster,
  checkpointMaster,
  plantingCheckpointLogs,
  plantingTaskSchedules,
  taskMaster,
} from '../db/schema'
import { Layout } from '../views/layouts/base'
import { PlantingDetailPage } from '../views/plantings/detail'
import { PlantingCard } from '../views/partials/planting-card'
import type { CheckpointItemData } from '../views/partials/checkpoint-list'

const route = new Hono<AppType>()

route.get('/:id', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id
  const id = Number(c.req.param('id'))

  const planting = await db
    .select({
      id: plantings.id,
      vegetableId: plantings.vegetableId,
      vegetableName: vegetableMaster.name,
      spotId: plantings.spotId,
      spotName: spots.name,
      currentStageId: plantings.currentStageId,
    })
    .from(plantings)
    .innerJoin(vegetableMaster, eq(plantings.vegetableId, vegetableMaster.id))
    .innerJoin(spots, eq(plantings.spotId, spots.id))
    .where(and(eq(plantings.id, id), eq(plantings.userId, userId)))
    .get()

  if (!planting) return c.notFound()

  const allStages = await db
    .select({ id: stageMaster.id, name: stageMaster.name, orderIndex: stageMaster.orderIndex })
    .from(stageMaster)
    .where(eq(stageMaster.vegetableId, planting.vegetableId))
    .orderBy(asc(stageMaster.orderIndex))

  const stageIds = allStages.map((s) => s.id)

  const allCheckpoints =
    stageIds.length > 0
      ? await db
          .select({ id: checkpointMaster.id, stageId: checkpointMaster.stageId, name: checkpointMaster.name })
          .from(checkpointMaster)
          .where(inArray(checkpointMaster.stageId, stageIds))
          .orderBy(asc(checkpointMaster.orderIndex))
      : []

  const completedLogs = await db
    .select()
    .from(plantingCheckpointLogs)
    .where(eq(plantingCheckpointLogs.plantingId, id))

  const checkpointItems: CheckpointItemData[] = allStages.flatMap((stage) => {
    const cp = allCheckpoints.find((row) => row.stageId === stage.id)
    if (!cp) return []
    const log = completedLogs.find((row) => row.checkpointMasterId === cp.id)
    const isCurrentStage = stage.id === planting.currentStageId
    return [
      {
        id: cp.id,
        name: cp.name,
        plantingId: id,
        completedAt: log
          ? new Date(log.completedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
          : undefined,
        isCurrent: isCurrentStage && !log,
      },
    ]
  })

  const recentTasks = await db
    .select({ completedAt: plantingTaskSchedules.completedAt, taskName: taskMaster.name })
    .from(plantingTaskSchedules)
    .innerJoin(taskMaster, eq(plantingTaskSchedules.taskMasterId, taskMaster.id))
    .where(and(eq(plantingTaskSchedules.plantingId, id), isNotNull(plantingTaskSchedules.completedAt)))
    .orderBy(desc(plantingTaskSchedules.completedAt))
    .limit(10)

  const recentHistory = recentTasks.map((t) => ({
    date: new Date(t.completedAt!).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' }),
    task: t.taskName,
  }))

  return c.html(
    <Layout title={planting.vegetableName}>
      <PlantingDetailPage
        id={id}
        vegetableName={planting.vegetableName}
        spotName={planting.spotName}
        spotId={planting.spotId}
        stages={allStages}
        currentStageId={planting.currentStageId}
        checkpoints={checkpointItems}
        recentHistory={recentHistory}
      />
    </Layout>
  )
})

route.get('/:id/card', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id
  const id = Number(c.req.param('id'))

  const planting = await db
    .select({
      id: plantings.id,
      vegetableName: vegetableMaster.name,
      spotName: spots.name,
      stageName: stageMaster.name,
      stageOrder: stageMaster.orderIndex,
    })
    .from(plantings)
    .innerJoin(vegetableMaster, eq(plantings.vegetableId, vegetableMaster.id))
    .innerJoin(spots, eq(plantings.spotId, spots.id))
    .leftJoin(stageMaster, eq(plantings.currentStageId, stageMaster.id))
    .where(and(eq(plantings.id, id), eq(plantings.userId, userId)))
    .get()

  if (!planting) return c.notFound()

  return c.html(
    <PlantingCard
      id={planting.id}
      vegetableName={planting.vegetableName}
      spotName={planting.spotName}
      stageName={planting.stageName ?? '—'}
      stageOrder={Math.max(0, (planting.stageOrder ?? 1) - 1)}
    />
  )
})

export default route
