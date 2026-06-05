import type { FC } from 'hono/jsx'

export const LoginPage: FC = () => (
  <html lang="ja" data-theme="lemonade">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>ログイン | 家庭菜園ハブ</title>
      <link href="https://cdn.jsdelivr.net/npm/daisyui@5/daisyui.css" rel="stylesheet" />
      <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    </head>
    <body class="bg-base-200 min-h-screen flex items-center justify-center">
      <div class="card bg-base-100 shadow-xl w-full max-w-sm mx-4">
        <div class="card-body items-center text-center gap-6">
          <div class="text-6xl">🌱</div>
          <div>
            <h1 class="text-2xl font-bold">家庭菜園ハブ</h1>
            <p class="text-base-content/60 mt-1 text-sm">家庭菜園の作業をかんたん管理</p>
          </div>
          <a href="/api/auth/signin/google" class="btn btn-primary w-full">
            Googleでログイン
          </a>
        </div>
      </div>
    </body>
  </html>
)
