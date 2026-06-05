<!-- 画面構成・コンポーネントツリー・HTMX部分更新ターゲットを定義するドキュメント -->

## 画面構成

### 画面一覧

| 画面名 | URL | 概要 |
|---|---|---|
| ログイン | `/auth/login` | Googleログインボタンのみ |
| ダッシュボード | `/` | 今日〜3日先のタスク + 栽培中の野菜カード一覧 |
| 栽培スポット一覧 | `/spots` | プランター・区画の一覧・追加・編集 |
| 栽培スポット詳細 | `/spots/:id` | 特定スポットに植えている野菜・チェックポイント状況 |
| 野菜を植える | `/spots/:id/plantings/new` | スポットに野菜を追加するフォーム |
| 栽培記録詳細 | `/plantings/:id` | チェックポイント一覧・作業履歴・現在のステージ |
| 設定 | `/settings` | 通知許可（Web Push）・通知時刻 |

### 各画面の主要コンポーネント

**ダッシュボード `/`**
```
├── TaskList                 # 今日〜3日先のタスク一覧（htmx対象）
│   ├── TaskItem             # 各タスク行（チェックボタン付き）
│   │                        #   days_bundled >= 2 の場合は「N日分まとめて」バッジを表示
│   └── TaskListEmpty        # 空状態: 「今日のタスクはありません」
└── PlantingCardList         # 栽培中の野菜カード一覧（htmx対象）
    ├── PlantingCard         # 野菜カード（野菜名・スポット名・現ステージ・次の作業）
    └── PlantingCardListEmpty # 空状態: 初回ガイド（下記参照）
```

**空状態の設計（Empty State）**

| 状態 | 表示内容 |
|---|---|
| スポット未作成 | 「まだ栽培スポットがありません」＋「[+ スポットを追加する]」ボタン（`/spots` へ誘導） |
| スポットあり・野菜未登録 | 「スポットはありますが、まだ野菜が植えられていません」＋「[+ 野菜を植える]」ボタン（`/spots/:id/plantings/new` へ誘導） |
| 野菜あり・当日タスクなし | 「今日のタスクはありません。ゆっくり休みましょう 🌱」（TaskListのみ） |

判定ロジック（サーバーサイドでダッシュボード描画時に分岐）：

```
GET /
  → spots が 0件 → PlantingCardListEmpty（スポット未作成）を表示
  → spots が 1件以上・plantings が 0件 → PlantingCardListEmpty（野菜未登録）を表示
  → plantings が 1件以上 → PlantingCardList を通常表示
  → 今日〜3日先のタスクが 0件 → TaskListEmpty を表示
```

**栽培記録詳細 `/plantings/:id`**
```
├── StageProgress      # 現在のステージ表示（進捗バー）
├── CheckpointList     # チェックポイント一覧（htmx対象）
│   └── CheckpointItem # 各チェックポイント（タップでステージ進行）
└── TaskHistory        # 過去の作業履歴
```

**栽培スポット一覧 `/spots`**
```
├── SpotList           # スポットカード一覧（htmx対象）
│   └── SpotCard       # スポット名・種別（地植え/プランター）・植えている野菜数
└── AddSpotForm        # スポット追加フォーム（htmx対象）
```

### HTMXによる部分更新の対象箇所

| 操作 | 更新対象要素 | エンドポイント |
|---|---|---|
| タスクのチェック完了 | `#task-list` | `POST /tasks/:id/complete` |
| チェックポイントのタップ | `#modal-container` | `GET /checkpoints/:id/confirm` |
| モーダルの「確定」ボタン | `#checkpoint-list`（メイン） + `#stage-progress`（OOB） | `POST /checkpoints/:id/complete` |
| 野菜カードの展開/折りたたみ | `#planting-card-:id` | `GET /plantings/:id/card` |
| スポット追加フォーム送信 | `#spot-list` | `POST /spots` |
| 野菜を植える（フォーム送信） | `#planting-card-list` | `POST /spots/:id/plantings` |
