<!-- 通知設計・タスクスケジュール生成・期限切れタスク処理・Web Pushを記載するドキュメント -->

## 通知設計

### Web Push購読フロー

```
① ユーザーが /settings にアクセス
② 「通知を有効にする」ボタンをクリック
③ ブラウザが通知許可を要求
④ 許可 → PushSubscription（endpoint・p256dh・auth）を生成
⑤ POST /settings/push-subscription でサーバーに保存
```

### タスクスケジュール生成

ステージ進行は不可逆（前ステージのタスクDELETE + 新ステージのタスクINSERT）なため、**モーダル確認を必須とする**。

```
① チェックポイントをタップ
   GET /checkpoints/:id/confirm
   → 確認モーダルHTMLを返す（#modal-container に挿入）
   → モーダル内容: 「[野菜名] が [次のステージ名] に進みます。確定しますか？」
                  「キャンセル」「確定」ボタン

② 「確定」ボタンをタップ
   POST /checkpoints/:id/complete
   → planting_checkpoint_logs に記録
   → 次のステージに current_stage_id を更新
   → 前ステージの未完了 recurring タスクを DELETE
   → 新ステージの task_master からスケジュールを生成
       one_time:  scheduled_date = jstDayStartSec(days_from_stage_start)
       recurring: 今日から90日分の日付配列を生成し、バルクINSERT
   → htmx レスポンス:
       メインbody:          #checkpoint-list の更新HTML
       hx-swap-oob="true": id="stage-progress" のステージ進捗HTML
       （モーダルは hx-on::after-request でクローズ）
```

**バルクINSERTの方針**: `recurring` タスクの90日分（最大90行）をループINSERTするとCPU時間を消費する。Drizzle ORMの `db.insert().values([...])` に配列を渡すバルクINSERTを使う。

```typescript
// src/lib/task-scheduler.ts イメージ
const rows = dates.map(date => ({
  plantingId,
  taskMasterId: task.id,
  scheduledDate: date,
}))
await db.insert(plantingTaskSchedules).values(rows)
```

### 毎朝7時の通知バッチ

```toml
# wrangler.toml
[triggers]
crons = ["0 22 * * *"]  # UTC 22:00 = JST 7:00
```

```
daily-notify.ts の処理フロー:

① push_subscriptions から全ユーザーの購読情報を取得
② ユーザーごとに:
    a. 当日の未完了タスクを取得（spots・vegetable_master とJOIN）
    b. タスクが0件 → スキップ
    c. 通知本文を組み立て
       例: "水やり: ミニトマト1号鉢、きゅうり\n追肥: ミニトマト1号鉢"
    d. Web Push APIで送信（1日1通）
    e. 購読が無効なら push_subscriptions から削除
```

### 期限切れ繰り返しタスクの処理方針

旅行等でアプリを開かなかった場合、同じ作業が複数日分積み重なる（例: 水やり×6件）。  
「やることが多すぎる」感はアンインストールの主因になるため、以下の方針で対処する。

**処理ロジック: ダッシュボード表示時の自動スキップ**

`GET /` を受け取ったとき、表示前に以下を実行する：

1. 今日より前（overdue）の `recurring` タスクのうち、同じ `(planting_id, task_master_id)` の組み合わせで2件以上 `pending`（`completed_at IS NULL AND skipped_at IS NULL`）のものを検索
2. 各組み合わせで `scheduled_date` が最も新しい1件だけを残し、それより古い分に `skipped_at = now()` をセット
3. 残った1件を通常通り表示する

```typescript
// src/routes/index.ts（ダッシュボードハンドラー内）
// overdue pending recurring タスクを自動スキップ
await db.run(sql`
  UPDATE planting_task_schedules
  SET skipped_at = unixepoch()
  WHERE completed_at IS NULL
    AND skipped_at IS NULL
    AND scheduled_date < ${todayJstStartSec()}
    AND id NOT IN (
      SELECT MAX(id)
      FROM planting_task_schedules pts2
      JOIN task_master tm ON pts2.task_master_id = tm.id
      JOIN plantings p ON pts2.planting_id = p.id
      WHERE p.user_id = ${userId}
        AND tm.task_type = 'recurring'
        AND pts2.completed_at IS NULL
        AND pts2.skipped_at IS NULL
        AND pts2.scheduled_date < ${todayJstStartSec()}
      GROUP BY pts2.planting_id, pts2.task_master_id
    )
    AND planting_id IN (SELECT id FROM plantings WHERE user_id = ${userId})
`)
```

**表示ロジック: 「N日分」バッジ**

自動スキップ後に残った1件のタスクに対し、スキップ件数（`skipped_at IS NOT NULL` の同一 `(planting_id, task_master_id)` 件数）をあわせて取得し、1以上なら `TaskItem` にバッジを表示する。

```
□ 水やり  ミニトマト1号鉢  (3日分まとめて)   ← スキップ2件 + 当日1件 = 3日分
□ 水やり  きゅうり         (2日分まとめて)
□ 追肥    ミニトマト1号鉢                      ← スキップなし、バッジなし
```

- バッジは `DaisyUI` の `badge badge-warning badge-sm` で表示
- バッジのラベル: `{n}日分まとめて`（n = スキップ件数 + 1）

### ダッシュボードの3日先表示クエリ

`planting_task_schedules` に `user_id` は持たない。`plantings` を JOIN してユーザーフィルタを行う。  
自動スキップ処理後に実行する。

```sql
SELECT
  pts.*,
  tm.name        AS task_name,
  tm.task_type,
  v.name         AS vegetable_name,
  sp.name        AS spot_name,
  COUNT(skipped.id) + 1 AS days_bundled   -- スキップ分 + 当日分
FROM planting_task_schedules pts
JOIN plantings p    ON pts.planting_id = p.id
JOIN task_master tm ON pts.task_master_id = tm.id
JOIN spots sp       ON p.spot_id = sp.id
JOIN vegetable_master v ON p.vegetable_id = v.id
LEFT JOIN planting_task_schedules skipped
  ON  skipped.planting_id   = pts.planting_id
  AND skipped.task_master_id = pts.task_master_id
  AND skipped.skipped_at IS NOT NULL
  AND skipped.scheduled_date >= :todayMinus90  -- 直近90日のスキップを対象
WHERE p.user_id = :userId
  AND pts.scheduled_date BETWEEN :today AND :todayPlus3
  AND pts.completed_at IS NULL
  AND pts.skipped_at IS NULL
GROUP BY pts.id
ORDER BY pts.scheduled_date ASC
```

### 通知トリガー条件まとめ

| タイミング | 処理 |
|---|---|
| 野菜を植えた（planting作成） | 最初のステージのタスクを生成 |
| チェックポイント完了 | 次ステージのタスクを生成・前ステージの未完了タスクを削除 |
| 毎朝7時（Cron Trigger） | 当日タスクをWeb Pushで一括通知 |
| タスク完了（チェック） | `completed_at` を記録するのみ |
| ダッシュボード表示（GET /） | 期限切れ `recurring` タスクの自動スキップ処理を実行（表示前） |

### タイムゾーン処理方針

Cloudflare Workers のデフォルトタイムゾーンは UTC。日本時間（JST = UTC+9）とのズレを考慮しないと「今日のタスク」が9時間ずれる。

**方針: DBにはUTC Unixエポック（秒）で保存。日付演算はJST基準で行う。**

```typescript
// src/lib/date.ts  共通ユーティリティ
const JST_OFFSET_SEC = 9 * 60 * 60

/** JSTの「今日の00:00:00」をUnixエポック（秒）で返す */
export function todayJstStartSec(): number {
  const nowSec = Math.floor(Date.now() / 1000)
  const jstSec = nowSec + JST_OFFSET_SEC
  const dayStartJst = jstSec - (jstSec % 86400)
  return dayStartJst - JST_OFFSET_SEC  // UTCエポックに戻す
}

/** JSTのN日後00:00:00をUnixエポック（秒）で返す */
export function jstDayStartSec(daysFromToday: number): number {
  return todayJstStartSec() + daysFromToday * 86400
}
```

- タスクスケジュール生成: `jstDayStartSec(n)` で `scheduled_date` を計算
- ダッシュボードクエリ: `BETWEEN todayJstStartSec() AND jstDayStartSec(3)` で3日先まで取得
- Cron Trigger（UTC 22:00 = JST 7:00）: バッチ内でも `todayJstStartSec()` を使用

### Web Pushライブラリの選定

`web-push` (npm) は内部で `node:crypto` / `node:https` を使用するため Cloudflare Workers 非互換。
代わりに Web Crypto API ベースの以下を使用する。

```
@block65/webcrypto-web-push
```

Workers / Bun / Deno 対応、Node.js API に依存しない。TypeScript 型定義あり。

### VAPID鍵の管理

VAPID鍵は `@block65/webcrypto-web-push` のユーティリティで生成する。

```bash
# 鍵生成（ライブラリのユーティリティを使用）
node -e "const {generateVapidKeys} = require('@block65/webcrypto-web-push'); generateVapidKeys().then(console.log)"
wrangler secret put VAPID_PUBLIC_KEY
wrangler secret put VAPID_PRIVATE_KEY
```

```toml
[vars]
VAPID_SUBJECT = "mailto:your@gmail.com"
```
