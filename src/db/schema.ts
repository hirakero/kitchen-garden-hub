import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// --------------- マスター系 ---------------

export const vegetableMaster = sqliteTable('vegetable_master', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const stageMaster = sqliteTable('stage_master', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vegetableId: integer('vegetable_id')
    .notNull()
    .references(() => vegetableMaster.id),
  name: text('name').notNull(),
  orderIndex: integer('order_index').notNull(),
  description: text('description'),
})

export const checkpointMaster = sqliteTable('checkpoint_master', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  stageId: integer('stage_id')
    .notNull()
    .references(() => stageMaster.id),
  name: text('name').notNull(),
  description: text('description'),
  orderIndex: integer('order_index').notNull().default(1),
})

export const taskMaster = sqliteTable('task_master', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  stageId: integer('stage_id')
    .notNull()
    .references(() => stageMaster.id),
  name: text('name').notNull(),
  description: text('description'),
  taskType: text('task_type', { enum: ['one_time', 'recurring'] }).notNull(),
  daysFromStageStart: integer('days_from_stage_start'),
  intervalDays: integer('interval_days'),
})

// --------------- ユーザーデータ系 ---------------

export const spots = sqliteTable('spots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  type: text('type', { enum: ['ground', 'planter'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdateFn(() => new Date()),
})

export const plantings = sqliteTable('plantings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  spotId: integer('spot_id')
    .notNull()
    .references(() => spots.id),
  vegetableId: integer('vegetable_id')
    .notNull()
    .references(() => vegetableMaster.id),
  currentStageId: integer('current_stage_id').references(() => stageMaster.id),
  plantedAt: integer('planted_at', { mode: 'timestamp' }).notNull(),
  finishedAt: integer('finished_at', { mode: 'timestamp' }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdateFn(() => new Date()),
})

export const plantingCheckpointLogs = sqliteTable('planting_checkpoint_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  plantingId: integer('planting_id')
    .notNull()
    .references(() => plantings.id),
  checkpointMasterId: integer('checkpoint_master_id')
    .notNull()
    .references(() => checkpointMaster.id),
  completedAt: integer('completed_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const plantingTaskSchedules = sqliteTable('planting_task_schedules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  plantingId: integer('planting_id')
    .notNull()
    .references(() => plantings.id),
  taskMasterId: integer('task_master_id')
    .notNull()
    .references(() => taskMaster.id),
  scheduledDate: integer('scheduled_date', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  skippedAt: integer('skipped_at', { mode: 'timestamp' }),
})

// --------------- 通知系 ---------------

export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})
