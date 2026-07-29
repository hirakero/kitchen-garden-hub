<!-- 技術スタック・設計方針・概要を定義するメインドキュメント -->

# Kitchen Garden Hub — 仕様書

## 概要

家庭菜園の補助Webアプリ。水やり・追肥・芽かき・摘果などの作業タイミングを逃さないようにリマインドし、ズボラな人でも野菜を育て続けられるようにする。

まず自分専用のWebアプリとして構築し、うまくいけばユーザー登録ありの一般公開サービスへ拡張する。

---

## 技術スタック

| 項目 | 選択 |
|---|---|
| ランタイム | Cloudflare Workers |
| Webフレームワーク | Hono |
| フロントエンド | htmx（サーバーサイド主導のHTML部分更新） |
| スタイリング | Tailwind CSS + DaisyUI（CDN読み込み、ビルドステップなし） |
| データベース | Cloudflare D1（SQLite） |
| ORM | Drizzle ORM |
| バリデーション | drizzle-zod + zod-validator（Honoミドルウェア） |
| 認証 | better-auth |
| 通知 | Web Push API + Cloudflare Cron Trigger |

---

## 機能要件

### 通知・リマインダー

- **ダッシュボード表示**をMVPの通知手段とする
- **プッシュ通知**（Web Push API）は Phase 2 で追加
- 将来フェーズで LINE / Slack 通知を追加

### ダッシュボード（メイン画面）

- **上部**: 今日〜3日先のタスク一覧（チェックして完了記録）
- **下部**: 栽培中の野菜カード一覧（プランター・区画ごと）
- モバイルでは縦スクロール、デスクトップでは左右分割

### 栽培管理（コア機能）

- 野菜ごとに **生育ステージ** と **チェックポイント** を事前定義（マスターデータ）
- ユーザーはチェックポイントをタップするだけでステージが進む
- ステージ進行に連動して次のタスクスケジュールが自動生成
- タスクは2種類：
  - **一回限りのタスク**（定植・追肥・摘芯など）: ステージ進行からN日後に発火
  - **繰り返しタスク**（水やり・観察など）: X日ごとに繰り返し（90日分を事前生成）

### 栽培環境

- **地植え（畑・庭の区画）** と **プランター・鉢** の両方に対応
- 各栽培箇所に名前をつけて管理（例：「ベランダプランター左」「庭の南区画」）

---

## UI / UX

- **モバイルファースト**（畑・ベランダでスマホから操作する想定）
- Tailwind CSS + DaisyUI をCDNで読み込み（ビルドステップなし）
- htmx によるHTML部分更新（ページ全体リロードなし）

---

## フォルダ構成

```
kitchen-garden-hub-cc/
├── src/
│   ├── index.ts                  # Workerエントリーポイント（Honoアプリ + Cron Trigger）
│   ├── app.ts                    # Honoインスタンス・グローバルミドルウェア設定
│   ├── routes/
│   │   ├── index.ts              # ダッシュボード GET /
│   │   ├── auth.ts               # 認証 /auth/*
│   │   ├── spots.ts              # スポット /spots/*
│   │   ├── plantings.ts          # 栽培記録 /plantings/*
│   │   ├── tasks.ts              # タスク完了 POST /tasks/:id/complete
│   │   ├── checkpoints.ts        # チェックポイント GET /checkpoints/:id/confirm, POST /checkpoints/:id/complete
│   │   └── settings.ts           # 設定 /settings
│   ├── views/
│   │   ├── layouts/
│   │   │   └── base.tsx          # htmx・Tailwind・DaisyUIをCDNで読み込み
│   │   ├── dashboard.tsx
│   │   ├── auth/
│   │   │   └── login.tsx
│   │   ├── spots/
│   │   │   ├── index.tsx
│   │   │   └── detail.tsx
│   │   ├── plantings/
│   │   │   ├── new.tsx
│   │   │   └── detail.tsx
│   │   ├── settings.tsx
│   │   └── partials/             # htmx部分更新レスポンス用
│   │       ├── task-list.tsx
│   │       ├── task-item.tsx
│   │       ├── task-list-empty.tsx           # タスクなし空状態
│   │       ├── checkpoint-list.tsx
│   │       ├── checkpoint-confirm-modal.tsx  # ステージ進行確認モーダル
│   │       ├── planting-card.tsx
│   │       ├── planting-card-list.tsx
│   │       ├── planting-card-list-empty.tsx  # 野菜未登録空状態（スポット未作成/野菜未登録で分岐）
│   │       └── spot-list.tsx
│   ├── db/
│   │   ├── schema.ts             # Drizzleスキーマ定義（全テーブル）
│   │   ├── index.ts              # D1接続ヘルパー
│   │   └── seed/
│   │       ├── index.ts          # シード実行エントリー
│   │       └── vegetables.ts     # 野菜9種のマスターデータ
│   ├── lib/
│   │   ├── auth.ts               # better-auth設定
│   │   ├── push.ts               # Web Push送信ヘルパー
│   │   └── task-scheduler.ts     # タスクスケジューリングロジック
│   ├── middleware/
│   │   └── require-auth.ts       # 認証必須ミドルウェア
│   └── cron/
│       └── daily-notify.ts       # 毎朝7時の通知バッチ処理
├── drizzle/
│   └── migrations/
├── wrangler.jsonc
├── drizzle.config.ts
├── tsconfig.json
├── package.json
└── spec.md
```

### ファイル命名規則

| 対象 | 規則 | 例 |
|---|---|---|
| ファイル名全般 | kebab-case | `task-scheduler.ts`, `planting-card.tsx` |
| ルートハンドラー | リソース名の複数形 | `spots.ts`, `plantings.ts` |
| パーシャル（htmx応答） | 対応するUI要素名 | `task-list.tsx`, `planting-card.tsx` |
| Drizzleテーブル変数 | camelCase（単数形） | `vegetableMaster`, `planting` |
| 型・インターフェース | PascalCase | `Planting`, `CheckpointItem` |
