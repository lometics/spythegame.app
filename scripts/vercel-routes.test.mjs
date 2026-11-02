import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const root = new URL('..', import.meta.url)
const vercel = JSON.parse(readFileSync(new URL('vercel.json', root), 'utf8'))
const app = readFileSync(new URL('src/App.tsx', root), 'utf8')

/** Path is served by the app (a rewrite to index.html or the invite function). */
const served = (path) =>
  vercel.rewrites.some((r) => new RegExp(`^${r.source.replace(/:\w+/g, '[^/]+')}$`).test(path))

describe('vercel.json rewrites', () => {
  const routes = [...app.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]).filter((p) => p !== '*' && p !== '/')

  it('found the app routes', () => {
    expect(routes).toContain('/room/:code')
  })

  it.each(routes)('serve the app route %s', (route) => {
    const path = route.replace(/:\w+/g, 'ABCD')
    expect(served(path)).toBe(true)
  })

  it('leave unknown URLs to the 404 page', () => {
    for (const path of ['/does-not-exist', '/room', '/local/play/extra', '/wp-admin/x']) {
      expect(served(path)).toBe(false)
    }
  })
})
