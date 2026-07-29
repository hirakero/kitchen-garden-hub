import type { Context } from 'hono'

/** HTMX の hx-post 等のリクエストをフルページ遷移させるレスポンスを返す */
export function hxRedirect(c: Context, url: string) {
  c.header('HX-Redirect', url)
  return c.body(null, 200)
}
