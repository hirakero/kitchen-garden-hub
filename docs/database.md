<!-- DBスキーマ・テーブル定義・Drizzleスキーマ定義例を記載するドキュメント -->

## DBスキーマ

### テーブル一覧

| テーブル名 | 概要 |
|---|---|
| `user` | better-auth管理（自動生成） |
| `session` | better-auth管理（自動生成） |
| `account` | better-auth管理（OAuth情報、自動生成） |
| `verification` | better-auth管理（自動生成） |
| `vegetable_master` | 野菜マスター（9種） |
| `stage_master` | 生育ステージマスター（野菜ごと） |
| `checkpoint_master` | チェックポイントマスター（ステージ進行トリガー） |
| `task_master` | 作業タスクマスター（ステージごとの作業定義） |
| `spots` | 栽培スポット（ユーザーのプランター・区画） |
| `plantings` | 栽培記録（スポットに植えた野菜） |
| `planting_checkpoint_logs` | チェックポイント完了履歴 |
| `planting_task_schedules` | 作業タスクスケジュール（自動生成） |
| `push_subscriptions` | Web Push購読情報 |

### テーブル定義

#### マスター系

```
vegetable_master
  id            INTEGER  PK autoIncrement
  name          TEXT     NOT NULL
  description   TEXT
  created_at    INTEGER  NOT NULL DEFAULT now

stage_master
  id            INTEGER  PK autoIncrement
  vegetable_id  INTEGER  NOT NULL FK→vegetable_master
  name          TEXT     NOT NULL
  order_index   INTEGER  NOT NULL
  description   TEXT

checkpoint_master
  id            INTEGER  PK autoIncrement
  stage_id      INTEGER  NOT NULL FK→stage_master
  name          TEXT     NOT NULL
  description   TEXT
  order_index   INTEGER  NOT NULL DEFAULT 1

task_master
  id            INTEGER  PK autoIncrement
  stage_id      INTEGER  NOT NULL FK→stage_master
  name          TEXT     NOT NULL
  description   TEXT
  task_type     TEXT     NOT NULL              -- 'one_time' | 'recurring'
  days_from_stage_start  INTEGER               -- one_time: ステージ進行からN日後
  interval_days INTEGER                        -- recurring: N日ごと
```

#### ユーザーデータ系

```
spots
  id            INTEGER  PK autoIncrement
  user_id       TEXT     NOT NULL FK→user
  name          TEXT     NOT NULL
  type          TEXT     NOT NULL              -- 'ground' | 'planter'
  created_at    INTEGER  NOT NULL DEFAULT now
  updated_at    INTEGER  NOT NULL DEFAULT now  -- UPDATE時は $onUpdateFn で明示セット

plantings
  id            INTEGER  PK autoIncrement
  user_id       TEXT     NOT NULL FK→user
  spot_id       INTEGER  NOT NULL FK→spots
  vegetable_id  INTEGER  NOT NULL FK→vegetable_master
  current_stage_id  INTEGER  FK→stage_master
  planted_at    INTEGER  NOT NULL
  finished_at   INTEGER
  notes         TEXT
  created_at    INTEGER  NOT NULL DEFAULT now
  updated_at    INTEGER  NOT NULL DEFAULT now

planting_checkpoint_logs
  id                    INTEGER  PK autoIncrement
  planting_id           INTEGER  NOT NULL FK→plantings
  checkpoint_master_id  INTEGER  NOT NULL FK→checkpoint_master
  completed_at          INTEGER  NOT NULL DEFAULT now

planting_task_schedules
  id              INTEGER  PK autoIncrement
  planting_id     INTEGER  NOT NULL FK→plantings
  task_master_id  INTEGER  NOT NULL FK→task_master
  scheduled_date  INTEGER  NOT NULL
  completed_at    INTEGER                        -- ユーザーが完了した日時
  skipped_at      INTEGER                        -- 自動スキップされた日時（NULL = pending or completed）
```

#### 通知系

```
push_subscriptions
  id          INTEGER  PK autoIncrement
  user_id     TEXT     NOT NULL FK→user
  endpoint    TEXT     NOT NULL UNIQUE
  p256dh      TEXT     NOT NULL
  auth        TEXT     NOT NULL
  created_at  INTEGER  NOT NULL DEFAULT now
```

### リレーション

```
vegetable_master ──< stage_master ──< checkpoint_master
                              └──────< task_master

user ──< spots ──< plantings >── vegetable_master
                   plantings >── stage_master (current_stage_id)
                   plantings ──< planting_checkpoint_logs >── checkpoint_master
                   plantings ──< planting_task_schedules  >── task_master

user ──< push_subscriptions
```

### Drizzleスキーマ定義例（主要テーブル）

```typescript
// src/db/schema.ts
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

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
  vegetableId: integer('vegetable_id').notNull()
    .references(() => vegetableMaster.id),
  name: text('name').notNull(),
  orderIndex: integer('order_index').notNull(),
  description: text('description'),
})

export const taskMaster = sqliteTable('task_master', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  stageId: integer('stage_id').notNull()
    .references(() => stageMaster.id),
  name: text('name').notNull(),
  description: text('description'),
  taskType: text('task_type', { enum: ['one_time', 'recurring'] }).notNull(),
  daysFromStageStart: integer('days_from_stage_start'),
  intervalDays: integer('interval_days'),
})

export const plantings = sqliteTable('plantings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  spotId: integer('spot_id').notNull()
    .references(() => spots.id),
  vegetableId: integer('vegetable_id').notNull()
    .references(() => vegetableMaster.id),
  currentStageId: integer('current_stage_id')
    .references(() => stageMaster.id),
  plantedAt: integer('planted_at', { mode: 'timestamp' }).notNull(),
  finishedAt: integer('finished_at', { mode: 'timestamp' }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdateFn(() => new Date()),  // D1はON UPDATE非対応のためDrizzle側で処理
})

export const spots = sqliteTable('spots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  type: text('type', { enum: ['ground', 'planter'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdateFn(() => new Date()),
})

export const plantingTaskSchedules = sqliteTable('planting_task_schedules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  plantingId: integer('planting_id').notNull()
    .references(() => plantings.id),
  taskMasterId: integer('task_master_id').notNull()
    .references(() => taskMaster.id),
  scheduledDate: integer('scheduled_date', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  skippedAt: integer('skipped_at', { mode: 'timestamp' }),  // 自動スキップ時にセット
})
```
