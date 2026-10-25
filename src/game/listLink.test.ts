import { describe, expect, it } from 'vitest'
import { listLink, readListLink } from './listLink'

const list = {
  name: 'Büro-Insider 🕵️',
  icon: 'star',
  pairs: [
    { civilian: 'Kaffeemaschine', spy: 'Wasserkocher' },
    { civilian: '会議', spy: '打ち合わせ' },
  ],
}

const hashOf = (url: string) => url.slice(url.indexOf('#'))

describe('list links', () => {
  it('round-trips names and pairs, including non-Latin text and emoji', () => {
    const url = listLink('https://spythegame.app', list)
    expect(url.startsWith('https://spythegame.app/list#')).toBe(true)
    expect(readListLink(hashOf(url))).toEqual(list)
  })

  it('uses only URL-safe characters', () => {
    expect(hashOf(listLink('https://x', list)).slice(1)).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('rejects broken, empty or missing data', () => {
    expect(readListLink('')).toBeNull()
    expect(readListLink('#not-base64-json!!')).toBeNull()
    expect(readListLink(hashOf(listLink('https://x', { ...list, pairs: [] })))).toBeNull()
    expect(readListLink(hashOf(listLink('https://x', { ...list, name: '  ' })))).toBeNull()
  })

  it('drops incomplete pairs and trims long text', () => {
    const url = listLink('https://x', {
      name: 'x'.repeat(100),
      icon: 'star',
      pairs: [
        { civilian: 'A', spy: '' },
        { civilian: 'B', spy: 'C' },
      ],
    })
    const read = readListLink(hashOf(url))!
    expect(read.name).toHaveLength(60)
    expect(read.pairs).toEqual([{ civilian: 'B', spy: 'C' }])
  })
})
