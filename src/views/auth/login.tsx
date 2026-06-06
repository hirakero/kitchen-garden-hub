import type { FC } from 'hono/jsx'

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: 'このアカウントはご利用いただけません。',
}

export const LoginPage: FC<{ error?: string | null }> = ({ error }) => (
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
          {error && (
            <div role="alert" class="alert alert-error w-full text-sm py-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{ERROR_MESSAGES[error] ?? 'ログインに失敗しました。'}</span>
            </div>
          )}
          <button
            class="btn btn-primary w-full"
            id="signin-btn"
            {...{ onclick: "this.classList.add('btn-disabled');this.querySelector('span').className='loading loading-spinner loading-sm';window.location='/api/auth/signin/google'" }}
          >
            <span>Googleでログイン</span>
          </button>
        </div>
      </div>
    </body>
  </html>
)
