import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { inviteHtml } from './join'

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const meta = (html: string, key: string) =>
  html.match(new RegExp(`(?:property|name)="${key}" content="([^"]*)"`))?.[1]

describe('inviteHtml', () => {
  it('puts the room code into title and preview tags', () => {
    const html = inviteHtml(page, 'abcd', 'en')
    expect(html).toContain('<title>Join my Spy game, room ABCD</title>')
    expect(meta(html, 'og:title')).toBe('Join my Spy game, room ABCD')
    expect(meta(html, 'twitter:title')).toBe('Join my Spy game, room ABCD')
    expect(meta(html, 'og:description')).toMatch(/^Tap to join/)
    expect(meta(html, 'description')).toMatch(/^Tap to join/)
    expect(meta(html, 'og:url')).toBe('https://spythegame.app/join/ABCD')
  })

  it("uses the inviter's language and falls back to English", () => {
    expect(meta(inviteHtml(page, 'ABCD', 'xx'), 'og:title')).toBe('Join my Spy game, room ABCD')
  })

  it('cannot inject markup through the code', () => {
    const html = inviteHtml(page, '"><script>', 'en')
    expect(html).not.toContain('<script>"')
    expect(meta(html, 'og:url')).toBe('https://spythegame.app/join/SCRI')
  })

  it('keeps the rest of the page', () => {
    expect(inviteHtml(page, 'ABCD', 'en')).toContain('<div id="root">')
  })
})
