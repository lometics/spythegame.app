import { readFileSync } from 'node:fs'
import { getTransformedRoutes, sourceToRegex } from '@vercel/routing-utils'
import { describe, expect, it } from 'vitest'

const root = new URL('..', import.meta.url)
const vercel = JSON.parse(readFileSync(new URL('vercel.json', root), 'utf8'))
const app = readFileSync(new URL('src/App.tsx', root), 'utf8')

/** Path is served by the app (a rewrite to index.html or the invite function), matched the way Vercel does. */
const served = (path) => vercel.rewrites.some((r) => new RegExp(sourceToRegex(r.source).src).test(path))
const redirected = (path) => vercel.redirects.find((r) => new RegExp(sourceToRegex(r.source).src).test(path))

describe('vercel.json', () => {
  it('is accepted by Vercel', () => {
    expect(getTransformedRoutes(vercel).error).toBeNull()
  })

  const routes = [...app.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]).filter((p) => p !== '*' && p !== '/')

  it('found the app routes', () => {
    expect(routes).toContain('/room/:code')
  })

  it.each(routes)('serves the app route %s', (route) => {
    const path = route.replace(/:\w+/g, 'ABCD')
    expect(served(path)).toBe(true)
    expect(served(`${path}/`)).toBe(true)
  })

  it('leaves unknown URLs to the 404 page', () => {
    for (const path of ['/does-not-exist', '/room', '/local/play/extra', '/wp-admin/x']) {
      expect(served(path)).toBe(false)
    }
  })

  it('redirects the old how-to-play page with and without the slash', () => {
    expect(redirected('/how-to-play')?.destination).toBe('/en/')
    expect(redirected('/how-to-play/')?.destination).toBe('/en/')
  })
})
