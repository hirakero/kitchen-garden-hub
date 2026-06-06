import { Hono } from 'hono'
import { eq, and, isNull, gte, lte, asc, desc } from 'drizzle-orm'
import type { AppType } from '../app'
import { getDb } from '../db'
import { plantings, plantingTaskSchedules, taskMaster, vegetableMaster, spots, stageMaster } from '../db/schema'
import { Layout } from '../views/layouts/base'
import { DashboardPage } from '../views/dashboard'
import type { TaskItemData } from '../views/partials/task-item'
import type { PlantingCardData } from '../views/partials/planting-card'

const route = new Hono<AppType>()

type DayGroup = { label: string; isToday: boolean; tasks: TaskItemData[] }

// Exported so tasks route can reuse for the task-list partial refresh
export async function fetchTaskGroups(db: ReturnType<typeof getDb>, userId: string): Promise<DayGroup[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const pastBound = new Date(today)
  pastBound.setDate(today.getDate() - 7)
  const futureBound = new Date(today)
  futureBound.setDate(today.getDate() + 3)
  futureBound.setHours(23, 59, 59, 999)

  const rows = await db
    .select({
      id: plantingTaskSchedules.id,
      scheduledDate: plantingTaskSchedules.scheduledDate,
      completedAt: plantingTaskSchedules.completedAt,
      taskName: taskMaster.name,
      taskType: taskMaster.taskType,
      vegetableName: vegetableMaster.name,
      spotName: spots.name,
    })
    .from(plantingTaskSchedules)
    .innerJoin(taskMaster, eq(plantingTaskSchedules.taskMasterId, taskMaster.id))
    .innerJoin(plantings, eq(plantingTaskSchedules.plantingId, plantings.id))
    .innerJoin(vegetableMaster, eq(plantings.vegetableId, vegetableMaster.id))
    .innerJoin(spots, eq(plantings.spotId, spots.id))
    .where(
      and(
        eq(plantings.userId, userId),
        isNull(plantings.finishedAt),
        gte(plantingTaskSchedules.scheduledDate, pastBound),
        lte(plantingTaskSchedules.scheduledDate, futureBound),
        isNull(plantingTaskSchedules.skippedAt),
      )
    )
    .orderBy(asc(plantingTaskSchedules.scheduledDate))

  const today2 = new Date()
  today2.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today2); tomorrow.setDate(today2.getDate() + 1)
  const dayAfter = new Date(today2); dayAfter.setDate(today2.getDate() + 2)
  const yesterday = new Date(today2); yesterday.setDate(today2.getDate() - 1)
  const dateKey = (d: Date) => d.toISOString().split('T')[0]
  const todayKey = dateKey(today2)
  const tomorrowKey = dateKey(tomorrow)
  const dayAfterKey = dateKey(dayAfter)
  const yesterdayKey = dateKey(yesterday)

  const labelFor = (key: string, date: Date): { label: string; isToday: boolean } => {
    if (key === todayKey) return { label: '今日', isToday: true }
    if (key === tomorrowKey) return { label: '明日', isToday: false }
    if (key === dayAfterKey) return { label: '明後日', isToday: false }
    if (key === yesterdayKey) return { label: '昨日', isToday: false }
    return { label: `${date.getMonth() + 1}/${date.getDate()}`, isToday: false }
  }

  const groupMap = new Map<string, { date: Date; tasks: TaskItemData[] }>()
  for (const row of rows) {
    const d = new Date(row.scheduledDate)
    d.setHours(0, 0, 0, 0)
    const key = dateKey(d)
    if (!groupMap.has(key)) groupMap.set(key, { date: d, tasks: [] })
    groupMap.get(key)!.tasks.push({
      id: row.id,
      taskName: row.taskName,
      vegetableName: row.vegetableName,
      spotName: row.spotName,
      taskType: row.taskType,
      completedAt: row.completedAt ? Number(row.completedAt) : null,
    })
  }

  return [...groupMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { date, tasks }]) => ({ ...labelFor(key, date), tasks }))
}

route.get('/', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayMs = today.getTime()

  const futureBound = new Date(today)
  futureBound.setDate(today.getDate() + 3)
  futureBound.setHours(23, 59, 59, 999)

  const [taskGroups, activePlantings, allSpots, upcomingTasks] = await Promise.all([
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
    // Earliest uncompleted task per planting for "next task" label on cards
    db
      .select({
        plantingId: plantingTaskSchedules.plantingId,
        scheduledDate: plantingTaskSchedules.scheduledDate,
        taskName: taskMaster.name,
      })
      .from(plantingTaskSchedules)
      .innerJoin(taskMaster, eq(plantingTaskSchedules.taskMasterId, taskMaster.id))
      .innerJoin(plantings, eq(plantingTaskSchedules.plantingId, plantings.id))
      .where(
        and(
          eq(plantings.userId, userId),
          isNull(plantings.finishedAt),
          isNull(plantingTaskSchedules.completedAt),
          isNull(plantingTaskSchedules.skippedAt),
          gte(plantingTaskSchedules.scheduledDate, today),
          lte(plantingTaskSchedules.scheduledDate, futureBound),
        )
      )
      .orderBy(asc(plantingTaskSchedules.scheduledDate)),
  ])

  // Build nextTask label per planting (first upcoming task in the window)
  const nextTaskMap = new Map<number, string>()
  for (const t of upcomingTasks) {
    if (nextTaskMap.has(t.plantingId)) continue
    const d = new Date(t.scheduledDate)
    d.setHours(0, 0, 0, 0)
    const label = d.getTime() === todayMs ? '今日' : `${d.getMonth() + 1}/${d.getDate()}`
    nextTaskMap.set(t.plantingId, `${t.taskName} (${label})`)
  }

  const plantingCards: PlantingCardData[] = activePlantings.map((p) => ({
    id: p.id,
    vegetableName: p.vegetableName,
    spotName: p.spotName,
    stageName: p.stageName ?? '—',
    stageOrder: Math.max(0, (p.stageOrder ?? 1) - 1),
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
