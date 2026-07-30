import { eq, and, isNull, desc } from 'drizzle-orm'
import type { Db } from '../db'
import { plantingTaskSchedules, taskMaster, plantings, stageMaster } from '../db/schema'
import { jstDayStartSec, todayJstStartSec } from './date'

/** recurring タスクを事前生成する日数 */
const DAYS_AHEAD = 60

/** 最も先の予定日がこの日数を切ったら延長する（DAYS_AHEADより十分小さく、頻繁な延長を避ける） */
const TOPUP_THRESHOLD_DAYS = 30

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

/**
 * 多年草など「終わらない最終ステージ」（stage_master.is_ongoing）に留まっている栽培記録の
 * recurring タスクを、予定が尽きる前に延長する。チェックポイント完了では次ステージが無いため
 * 通常のタスク生成が二度と走らず、90日相当で通知が止まってしまう問題への対応。
 * ダッシュボード表示など、ユーザーが実際にアプリを開いたタイミングで呼ぶ想定（cron 不要）。
 */
export async function topUpOngoingSchedules(db: Db, userId: string): Promise<void> {
  const ongoingPlantings = await db
    .select({ plantingId: plantings.id, stageId: plantings.currentStageId })
    .from(plantings)
    .innerJoin(stageMaster, eq(plantings.currentStageId, stageMaster.id))
    .where(and(eq(plantings.userId, userId), isNull(plantings.finishedAt), eq(stageMaster.isOngoing, true)))

  if (ongoingPlantings.length === 0) return

  const todaySec = todayJstStartSec()
  const horizonSec = todaySec + DAYS_AHEAD * 86400

  for (const { plantingId, stageId } of ongoingPlantings) {
    if (stageId === null) continue

    const recurringTasks = await db
      .select()
      .from(taskMaster)
      .where(and(eq(taskMaster.stageId, stageId), eq(taskMaster.taskType, 'recurring')))

    const newRows: TaskScheduleRow[] = []

    for (const task of recurringTasks) {
      if (!task.intervalDays || task.intervalDays <= 0) continue

      const latest = await db
        .select({ scheduledDate: plantingTaskSchedules.scheduledDate })
        .from(plantingTaskSchedules)
        .where(and(eq(plantingTaskSchedules.plantingId, plantingId), eq(plantingTaskSchedules.taskMasterId, task.id)))
        .orderBy(desc(plantingTaskSchedules.scheduledDate))
        .limit(1)
        .get()

      const latestSec = latest ? Math.floor(latest.scheduledDate.getTime() / 1000) : todaySec - task.intervalDays * 86400
      const daysRemaining = (latestSec - todaySec) / 86400
      if (daysRemaining >= TOPUP_THRESHOLD_DAYS) continue

      for (let cursor = latestSec + task.intervalDays * 86400; cursor <= horizonSec; cursor += task.intervalDays * 86400) {
        newRows.push({ plantingId, taskMasterId: task.id, scheduledDate: new Date(cursor * 1000) })
      }
    }

    if (newRows.length > 0) {
      await db.insert(plantingTaskSchedules).values(newRows)
    }
  }
}
