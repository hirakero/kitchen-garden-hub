import { Hono } from 'hono'
import { eq, and, isNull, gte, lte, asc, desc } from 'drizzle-orm'
import type { AppType } from '../app'
import { getDb } from '../db'
import { plantings, plantingTaskSchedules, taskMaster, vegetableMaster, spots, stageMaster } from '../db/schema'
import { todayJstStartSec, jstDayStartSec } from '../lib/date'
import { Layout } from '../views/layouts/base'
import { DashboardPage } from '../views/dashboard'
import type { TaskItemData } from '../views/partials/task-item'
import type { PlantingCardData } from '../views/partials/planting-card'

const route = new Hono<AppType>()

const JST_OFFSET_MS = 9 * 60 * 60 * 1000
// Convert a UTC Date to its JST calendar day key (e.g. "2026-06-06")
const dateKeyJst = (d: Date) => new Date(d.getTime() + JST_OFFSET_MS).toISOString().split('T')[0]

type DayGroup = { label: string; isToday: boolean; isPast: boolean; tasks: TaskItemData[] }

// Exported so tasks route can reuse for the task-list partial refresh after completion/skip
export async function fetchTaskGroups(db: ReturnType<typeof getDb>, userId: string): Promise<DayGroup[]> {
  // Single JST-based reference time — derive all bounds and labels from this to avoid midnight races
  const todaySec = todayJstStartSec()
  const pastBound = new Date(jstDayStartSec(-7) * 1000)
  const futureBound = new Date((jstDayStartSec(4) - 1) * 1000)

  const rows = await db
    .select({
      id: plantingTaskSchedules.id,
      scheduledDate: plantingTaskSchedules.scheduledDate,
      completedAt: plantingTaskSchedules.completedAt,
      taskName: taskMaster.name,
      taskType: taskMaster.taskType,
      vegetableName: vegetableMaster.name,
      spotName: spots.name,
      plantingId: plantings.id,
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

  const todayKeyJst = dateKeyJst(new Date(todaySec * 1000))
  const tomorrowKeyJst = dateKeyJst(new Date((todaySec + 86400) * 1000))
  const dayAfterKeyJst = dateKeyJst(new Date((todaySec + 2 * 86400) * 1000))
  const yesterdayKeyJst = dateKeyJst(new Date((todaySec - 86400) * 1000))

  const labelFor = (key: string, date: Date): { label: string; isToday: boolean } => {
    if (key === todayKeyJst) return { label: '今日', isToday: true }
    if (key === tomorrowKeyJst) return { label: '明日', isToday: false }
    if (key === dayAfterKeyJst) return { label: '明後日', isToday: false }
    if (key === yesterdayKeyJst) return { label: '昨日', isToday: false }
    return { label: `${date.getMonth() + 1}/${date.getDate()}`, isToday: false }
  }

  const groupMap = new Map<string, { date: Date; tasks: TaskItemData[] }>()
  for (const row of rows) {
    const key = dateKeyJst(row.scheduledDate)
    if (!groupMap.has(key)) groupMap.set(key, { date: new Date(row.scheduledDate), tasks: [] })
    groupMap.get(key)!.tasks.push({
      id: row.id,
      taskName: row.taskName,
      vegetableName: row.vegetableName,
      spotName: row.spotName,
      taskType: row.taskType,
      completedAt: row.completedAt ? Number(row.completedAt) : null,
      isPast: key < todayKeyJst,
      plantingId: row.plantingId,
    })
  }

  return [...groupMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { date, tasks }]) => ({ ...labelFor(key, date), isPast: key < todayKeyJst, tasks }))
}

route.get('/', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.var.user.id

  const todaySec = todayJstStartSec()
  const todayKeyJst = dateKeyJst(new Date(todaySec * 1000))

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
      const label = group.isToday ? '今日' : group.label
      nextTaskMap.set(task.plantingId, `${task.taskName} (${label})`)
    }
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
