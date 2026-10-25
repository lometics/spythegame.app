/** Seasonal word packs and decorations follow the calendar (northern hemisphere). */

export const SEASONS = ['halloween', 'christmas', 'easter', 'summer'] as const
export type Season = (typeof SEASONS)[number]

const isSeason = (s: string | null): s is Season => (SEASONS as readonly string[]).includes(s ?? '')

/** Easter Sunday of a year (anonymous Gregorian algorithm). */
export function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

const DAY = 24 * 60 * 60 * 1000

/** The season a date falls into, or null between seasons. */
export function seasonOf(date: Date): Season | null {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  if (m === 10 || (m === 11 && d === 1)) return 'halloween'
  if (m === 12 || (m === 1 && d <= 6)) return 'christmas'
  const easter = easterSunday(y).getTime()
  const today = new Date(y, m - 1, d).getTime()
  if (today >= easter - 21 * DAY && today <= easter + 7 * DAY) return 'easter'
  if ((m === 6 && d >= 15) || m === 7 || m === 8) return 'summer'
  return null
}

/** Today's season; `?season=christmas` in the URL overrides it for testing. */
export function currentSeason(): Season | null {
  try {
    const forced = new URLSearchParams(location.search).get('season')
    if (forced === 'none') return null
    if (isSeason(forced)) return forced
  } catch {
    // no location (tests, SSR)
  }
  return seasonOf(new Date())
}
