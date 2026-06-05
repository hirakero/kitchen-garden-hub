const JST_OFFSET_SEC = 9 * 60 * 60

/** JSTの「今日の00:00:00」をUnixエポック（秒）で返す */
export function todayJstStartSec(): number {
  const nowSec = Math.floor(Date.now() / 1000)
  const jstSec = nowSec + JST_OFFSET_SEC
  const dayStartJst = jstSec - (jstSec % 86400)
  return dayStartJst - JST_OFFSET_SEC
}

/** JSTのN日後00:00:00をUnixエポック（秒）で返す */
export function jstDayStartSec(daysFromToday: number): number {
  return todayJstStartSec() + daysFromToday * 86400
}
