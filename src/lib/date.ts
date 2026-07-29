const JST_OFFSET_SEC = 9 * 60 * 60
const JST_OFFSET_MS = JST_OFFSET_SEC * 1000

/**
 * JSTの「今日の00:00:00」をUnixエポック（秒）で返す。
 * nowMs は日付境界のテストのために注入可能（省略時は現在時刻）。
 */
export function todayJstStartSec(nowMs: number = Date.now()): number {
  const nowSec = Math.floor(nowMs / 1000)
  const jstSec = nowSec + JST_OFFSET_SEC
  const dayStartJst = jstSec - (jstSec % 86400)
  return dayStartJst - JST_OFFSET_SEC
}

/** JSTのN日後00:00:00をUnixエポック（秒）で返す */
export function jstDayStartSec(daysFromToday: number, nowMs: number = Date.now()): number {
  return todayJstStartSec(nowMs) + daysFromToday * 86400
}

/** DateをJSTのカレンダー日キー（例: "2026-06-06"）に変換する */
export function dateKeyJst(d: Date): string {
  return new Date(d.getTime() + JST_OFFSET_MS).toISOString().split('T')[0]
}

/** JSTの今日の日付キー（例: "2026-06-06"、date input の value/max 用） */
export function todayJstDateKey(): string {
  return dateKeyJst(new Date())
}

/** JST基準で日本語表示用にフォーマットする（Workersの実行TZはUTCのため明示指定が必要） */
export function formatDateJa(d: Date, opts?: Intl.DateTimeFormatOptions): string {
  return d.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', ...opts })
}
