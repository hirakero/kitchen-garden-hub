import { Hono } from 'hono'
import { eq, and, isNull, desc } from 'drizzle-orm'
import type { AppType } from '../app'
import { getDb } from '../db'
import { plantings, vegetableMaster, spots, stageMaster } from '../db/schema'
import { fetchTaskGroups } from '../lib/task-groups'
import { topUpOngoingSchedules } from '../lib/task-scheduler'
import { Layout } from '../views/layouts/base'
import { DashboardPage } from '../views/dashboard'
import type { PlantingCardData } from '../views/partials/planting-card'

const route = new Hono<AppType>()

route.get('/', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id

  // Perennial plantings (e.g. ニラ) sitting in an "ongoing" final stage never trigger a new
  // checkpoint, so their recurring tasks would otherwise run out ~60 days after the stage
  // was entered. Top them up here, on the one screen the user is guaranteed to open regularly.
  await topUpOngoingSchedules(db, userId)

  const [taskGroups, activePlantings, allSpots] = await Promise.all([
    fetchTaskGroups(db, userId),
    db
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
      .where(and(eq(plantings.userId, userId), isNull(plantings.finishedAt)))
      .orderBy(desc(plantings.createdAt)),
    db.select({ id: spots.id }).from(spots).where(eq(spots.userId, userId)).limit(1),
  ])

  // Derive nextTaskMap from already-fetched taskGroups data (no extra D1 query)
  const nextTaskMap = new Map<number, string>()
  for (const group of taskGroups) {
    if (group.isPast) continue
    for (const task of group.tasks) {
      if (!task.plantingId || task.completedAt || nextTaskMap.has(task.plantingId)) continue
      nextTaskMap.set(task.plantingId, `${task.taskName} (${group.label})`)
    }
  }

  const plantingCards: PlantingCardData[] = activePlantings.map((p) => ({
    id: p.id,
    vegetableName: p.vegetableName,
    spotName: p.spotName,
    stageName: p.stageName ?? '—',
    stageOrder: p.stageOrder ?? 0,
    nextTask: nextTaskMap.get(p.id),
  }))

  return c.html(
    <Layout title="ダッシュボード">
      <DashboardPage
        groups={taskGroups}
        plantings={plantingCards}
        hasSpots={allSpots.length > 0}
        firstSpotId={allSpots[0]?.id}
      />
    </Layout>
  )
})

export default route
