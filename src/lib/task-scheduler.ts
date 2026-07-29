import { eq } from 'drizzle-orm'
import type { Db } from '../db'
import { plantingTaskSchedules, taskMaster } from '../db/schema'
import { jstDayStartSec } from './date'

/** recurring タスクを事前生成する日数 */
const DAYS_AHEAD = 60

export type TaskScheduleRow = { plantingId: number; taskMasterId: number; scheduledDate: Date }

/**
 * ステージ開始時に生成すべきタスクスケジュールの行データを組み立てる（DB書き込みは行わない）。
 * 呼び出し側で他の書き込みと一緒に db.batch() に渡し、アトミックに反映することを想定している。
 */
export async function buildTaskSchedules(db: Db, plantingId: number, stageId: number): Promise<TaskScheduleRow[]> {
  const tasks = await db.select().from(taskMaster).where(eq(taskMaster.stageId, stageId))

  const dayFromToday = (days: number) => new Date(jstDayStartSec(days) * 1000)

  const schedules: TaskScheduleRow[] = []

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

  return schedules
}

/**
 * ステージ開始時のタスクスケジュール生成・即時保存。
 * planting 作成時（最初のステージ）に呼ばれる単発の書き込みで使う。
 * 他の書き込みとアトミックにまとめたい場合は buildTaskSchedules を使うこと。
 */
export async function generateTaskSchedules(db: Db, plantingId: number, stageId: number) {
  const schedules = await buildTaskSchedules(db, plantingId, stageId)
  if (schedules.length > 0) {
    await db.insert(plantingTaskSchedules).values(schedules)
  }
}
