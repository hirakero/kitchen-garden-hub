import { eq, and, isNull, gte, lte, asc } from 'drizzle-orm'
import type { Db } from '../db'
import { plantings, plantingTaskSchedules, taskMaster, vegetableMaster, spots } from '../db/schema'
import { todayJstStartSec, jstDayStartSec, dateKeyJst } from './date'
import type { TaskItemData } from '../views/partials/task-item'

export type DayGroup = { label: string; isToday: boolean; isPast: boolean; tasks: TaskItemData[] }

/**
 * ダッシュボード・タスク一覧パーシャル共用のタスク取得（昨日以前7日〜3日先、JST日付でグループ化）。
 */
export async function fetchTaskGroups(db: Db, userId: string): Promise<DayGroup[]> {
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
