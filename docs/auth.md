<!-- 認証方式・ログインフロー・セッション管理・ルート保護を記載するドキュメント -->

## 認証

- **better-auth** を最初から導入（個人利用→公開への作り直しを避ける）
- 個人利用中: Google OAuthで1ユーザーのみ許可（`ALLOWED_EMAIL` 環境変数で制限）
- 公開時: メール登録・複数ユーザー対応（制限チェックを削除するだけ）

---

## 認証フロー

### ログインフロー

```
① ユーザーが /auth/login にアクセス
② 「Googleでログイン」ボタンをクリック
③ Google OAuth 画面へリダイレクト
④ 認証完了 → /api/auth/callback/google にコールバック
⑤ better-auth が D1 の user・session テーブルを作成/更新
⑥ セッションクッキーをセット（HttpOnly / Secure / SameSite=Lax）
⑦ ダッシュボード / にリダイレクト
```

### セッション管理

| 項目 | 内容 |
|---|---|
| セッション保存先 | D1の `session` テーブル（better-auth管理） |
| セッション有効期限 | 30日 |
| セッション取得 | `auth.api.getSession()` で各リクエストで検証 |

### 認証ミドルウェア

```typescript
// src/middleware/require-auth.ts
export const requireAuth = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.redirect('/auth/login')
  // MVP: 許可メールアドレスの確認
  if (session.user.email !== c.env.ALLOWED_EMAIL) return c.text('Forbidden', 403)
  c.set('user', session.user)
  c.set('session', session.session)
  await next()
})
```

### ルート保護の定義

| ルート | 認証 |
|---|---|
| `GET /auth/login` | 不要 |
| `ALL /api/auth/*` | 不要（better-authハンドラー） |
| `GET /` | **必要** |
| `GET/POST /spots/*` | **必要** |
| `GET/POST /plantings/*` | **必要** |
| `POST /tasks/:id/complete` | **必要** |
| `POST /checkpoints/:id/complete` | **必要** |
| `GET/POST /settings/*` | **必要** |
