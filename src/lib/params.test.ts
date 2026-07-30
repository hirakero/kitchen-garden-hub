import { describe, it, expect } from 'vitest'
import { positiveInt } from './params'

describe('positiveInt', () => {
  it('accepts a positive integer string', () => {
    expect(positiveInt('42')).toBe(42)
  })

  it('accepts "0" as invalid (ids start at 1)', () => {
    expect(positiveInt('0')).toBeNull()
  })

  it('rejects negative numbers', () => {
    expect(positiveInt('-1')).toBeNull()
  })

  it('rejects non-integer numbers', () => {
    expect(positiveInt('1.5')).toBeNull()
  })

  it('rejects non-numeric strings', () => {
    expect(positiveInt('abc')).toBeNull()
  })

  it('rejects empty string', () => {
    expect(positiveInt('')).toBeNull()
  })

  it('rejects undefined (missing param)', () => {
    expect(positiveInt(undefined)).toBeNull()
  })

  it('rejects whitespace-only strings', () => {
    expect(positiveInt('   ')).toBeNull()
  })

  it('rejects values with trailing non-numeric characters', () => {
    expect(positiveInt('42abc')).toBeNull()
  })
})
