import type { FC, Child } from 'hono/jsx'

export const Layout: FC<{ title?: string; children?: Child }> = ({ title = 'Kitchen Garden Hub', children }) => (
  <html lang="ja" data-theme="lemonade">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title} | 菜園ハブ</title>
      <link href="https://cdn.jsdelivr.net/npm/daisyui@5/daisyui.css" rel="stylesheet" />
      <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
      <script src="https://unpkg.com/htmx.org@2"></script>
    </head>
    <body class="bg-base-200 min-h-screen">
      <nav class="navbar bg-base-100 shadow-sm sticky top-0 z-10">
        <div class="navbar-start">
          <a href="/" class="btn btn-ghost text-lg font-bold">🌱 菜園ハブ</a>
        </div>
        <div class="navbar-end gap-1">
          <a href="/spots" class="btn btn-ghost btn-sm">スポット</a>
          <a href="/settings" class="btn btn-ghost btn-sm">設定</a>
        </div>
      </nav>
      <main class="container mx-auto px-4 py-4 max-w-3xl">
        <div id="modal-container"></div>
        {children}
      </main>
    </body>
  </html>
)
