import { describe, expect, it } from 'vitest'
import { easterSunday, seasonOf } from './season'

const day = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

describe('easterSunday', () => {
  it.each([
    [2024, '2024-03-31'],
    [2025, '2025-04-20'],
    [2026, '2026-04-05'],
    [2027, '2027-03-28'],
    [2038, '2038-04-25'],
  ])('%i', (year, expected) => {
    expect(easterSunday(year).getTime()).toBe(day(expected).getTime())
  })
})

describe('seasonOf', () => {
  it.each([
    ['2026-10-01', 'halloween'],
    ['2026-10-31', 'halloween'],
    ['2026-11-01', 'halloween'],
    ['2026-11-02', null],
    ['2026-12-01', 'christmas'],
    ['2026-12-31', 'christmas'],
    ['2027-01-06', 'christmas'],
    ['2027-01-07', null],
    ['2026-03-15', 'easter'], // 3 weeks before Easter 2026 (April 5)
    ['2026-03-14', null],
    ['2026-04-12', 'easter'], // a week after
    ['2026-04-13', null],
    ['2026-06-14', null],
    ['2026-06-15', 'summer'],
    ['2026-08-31', 'summer'],
    ['2026-09-01', null],
  ])('%s → %s', (date, season) => {
    expect(seasonOf(day(date))).toBe(season)
  })
})
