import { describe, it, expect, vi, afterEach } from 'vitest'
import { todayJstStartSec, jstDayStartSec, dateKeyJst, todayJstDateKey, formatDateJa } from './date'

describe('todayJstStartSec', () => {
  it('returns the JST midnight epoch for a time just after JST midnight', () => {
    // 2026-06-05T15:00:01Z = 2026-06-06T00:00:01+09:00
    const nowMs = Date.UTC(2026, 5, 5, 15, 0, 1)
    expect(todayJstStartSec(nowMs)).toBe(Date.UTC(2026, 5, 5, 15, 0, 0) / 1000)
  })

  it('returns the previous JST day for a time just before JST midnight', () => {
    // 2026-06-05T14:59:59Z = 2026-06-05T23:59:59+09:00
    const nowMs = Date.UTC(2026, 5, 5, 14, 59, 59)
    expect(todayJstStartSec(nowMs)).toBe(Date.UTC(2026, 5, 4, 15, 0, 0) / 1000)
  })

  it('defaults to the current time when nowMs is omitted', () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 5, 5, 15, 0, 1))
    expect(todayJstStartSec()).toBe(Date.UTC(2026, 5, 5, 15, 0, 0) / 1000)
    vi.useRealTimers()
  })
})

describe('jstDayStartSec', () => {
  const nowMs = Date.UTC(2026, 5, 5, 15, 0, 1) // JST 2026-06-06 00:00:01

  it('returns the same day for offset 0', () => {
    expect(jstDayStartSec(0, nowMs)).toBe(todayJstStartSec(nowMs))
  })

  it('adds whole days for a positive offset', () => {
    expect(jstDayStartSec(3, nowMs)).toBe(todayJstStartSec(nowMs) + 3 * 86400)
  })

  it('subtracts whole days for a negative offset', () => {
    expect(jstDayStartSec(-7, nowMs)).toBe(todayJstStartSec(nowMs) - 7 * 86400)
  })
})

describe('dateKeyJst', () => {
  it('stays on the same JST calendar day just before midnight', () => {
    const d = new Date(Date.UTC(2026, 5, 5, 14, 59, 59, 999))
    expect(dateKeyJst(d)).toBe('2026-06-05')
  })

  it('rolls over to the next JST calendar day at midnight', () => {
    const d = new Date(Date.UTC(2026, 5, 5, 15, 0, 0))
    expect(dateKeyJst(d)).toBe('2026-06-06')
  })
})

describe('todayJstDateKey', () => {
  afterEach(() => vi.useRealTimers())

  it('reflects the JST calendar day, not the UTC one', () => {
    vi.useFakeTimers()
    // 2026-06-05T15:00:00Z is already 2026-06-06 in JST
    vi.setSystemTime(Date.UTC(2026, 5, 5, 15, 0, 0))
    expect(todayJstDateKey()).toBe('2026-06-06')
  })
})

describe('formatDateJa', () => {
  const d = new Date(Date.UTC(2026, 5, 5, 15, 30, 0)) // JST 2026-06-06 00:30

  it('formats using the JST calendar day, not the UTC one', () => {
    expect(formatDateJa(d, { year: 'numeric', month: '2-digit', day: '2-digit' })).toBe('2026/06/06')
  })

  it('respects custom Intl options', () => {
    expect(formatDateJa(d, { month: '2-digit', day: '2-digit' })).toBe('06/06')
  })
})
