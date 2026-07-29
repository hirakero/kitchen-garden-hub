/** ルートパラメータ・クエリの正の整数ID。妥当でなければ null を返す */
export function positiveInt(value: string | undefined): number | null {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : null
}
