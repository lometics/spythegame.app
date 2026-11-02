import { describe, expect, it } from 'vitest'
import { createReportFilter } from './errorReport'

describe('createReportFilter', () => {
  it('sends an error once', () => {
    const ok = createReportFilter()
    expect(ok('Boom', 'Error: Boom\n    at a (app.js:1:1)')).toBe(true)
    expect(ok('Boom', 'Error: Boom\n    at a (app.js:1:1)')).toBe(false)
  })

  it('treats the same message from another place as a new error', () => {
    const ok = createReportFilter()
    expect(ok('Boom', 'Error: Boom\n    at a (app.js:1:1)')).toBe(true)
    expect(ok('Boom', 'Error: Boom\n    at b (app.js:9:9)')).toBe(true)
  })

  it('stops after the per-page limit', () => {
    const ok = createReportFilter(2)
    expect([ok('a'), ok('b'), ok('c')]).toEqual([true, true, false])
  })

  it('skips noise from the browser and extensions', () => {
    const ok = createReportFilter()
    expect(ok('ResizeObserver loop completed with undelivered notifications.')).toBe(false)
    expect(ok('x', 'Error: x\n    at chrome-extension://abc/content.js:1:1')).toBe(false)
    expect(ok('Script error.')).toBe(false)
    expect(ok('')).toBe(false)
  })

  it('skips bots and crawlers but not phones', () => {
    const ok = createReportFilter()
    const phone = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36'
    expect(ok('Rejected', '', `${phone} (compatible; Google-Read-Aloud; +https://support.google.com/webmasters/answer/1061943)`)).toBe(false)
    expect(ok('x', '', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(false)
    expect(ok('x', '', 'Mozilla/5.0 (Linux; Android 12; CUBOT X50) Chrome/120.0 Mobile')).toBe(true)
    expect(ok('y', '', phone)).toBe(true)
  })
})
