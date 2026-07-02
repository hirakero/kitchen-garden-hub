import { eq } from 'drizzle-orm'
import type { Db } from '../db'
import { plantingTaskSchedules, taskMaster } from '../db/schema'
import { jstDayStartSec } from './date'

/** recurring タスクを事前生成する日数 */
const DAYS_AHEAD = 60

/**
 * ステージ開始時のタスクスケジュール生成。
 * planting 作成時（最初のステージ）とチェックポイント完了時（次ステージ）に呼ばれる。
 * scheduled_date は JST の日付 00:00:00 に正規化して保存する。
 */
export async function generateTaskSchedules(db: Db, plantingId: number, stageId: number) {
  const tasks = await db.select().from(taskMaster).where(eq(taskMaster.stageId, stageId))

  const dayFromToday = (days: number) => new Date(jstDayStartSec(days) * 1000)

  const schedules: { plantingId: number; taskMasterId: number; scheduledDate: Date }[] = []

  for (const task of tasks) {
    if (task.taskType === 'one_time') {
      schedules.push({
        plantingId,
        taskMasterId: task.id,
        scheduledDate: dayFromToday(task.daysFromStageStart ?? 0),
      })
    } else if (task.taskType === 'recurring' && task.intervalDays && task.intervalDays > 0) {
      for (let offset = 0; offset <= DAYS_AHEAD; offset += task.intervalDays) {
        schedules.push({
          plantingId,
          taskMasterId: task.id,
          scheduledDate: dayFromToday(offset),
        })
      }
    }
  }

  if (schedules.length > 0) {
    await db.insert(plantingTaskSchedules).values(schedules)
  }
}
