import type { FC } from 'hono/jsx'

export const SettingsPage: FC = () => (
  <div class="space-y-6">
    <h1 class="text-xl font-bold">設定</h1>

    <div class="card bg-base-100 shadow-sm">
      <div class="card-body p-4 space-y-3">
        <h2 class="font-bold">プッシュ通知</h2>
        <p class="text-sm text-base-content/60">
          毎朝7時に当日のタスクを通知します。
        </p>
        <div class="alert alert-info text-sm">
          <span>Phase 2で実装予定です。</span>
        </div>
        <button class="btn btn-primary w-full" disabled>
          通知を有効にする
        </button>
      </div>
    </div>

    <div class="card bg-base-100 shadow-sm">
      <div class="card-body p-4 space-y-3">
        <h2 class="font-bold">アカウント</h2>
        <p class="text-sm text-base-content/60">test@example.com でログイン中</p>
        <a href="/api/auth/signout" class="btn btn-outline btn-error btn-sm w-full">
          ログアウト
        </a>
      </div>
    </div>
  </div>
)
