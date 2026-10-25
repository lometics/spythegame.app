import { describe, expect, it } from 'vitest'
import { extractRoomCode, resolveHost, sortedRoster } from './roster'

const players = {
  zz: { name: 'First', joinedAt: 100 },
  aa: { name: 'Third', joinedAt: 300 },
  mm: { name: 'Second', joinedAt: 200 },
}

describe('sortedRoster', () => {
  it('orders by join time, not uid', () => {
    expect(sortedRoster(players).map((p) => p.name)).toEqual(['First', 'Second', 'Third'])
  })
})

describe('resolveHost', () => {
  const roster = sortedRoster(players)
  it('is the creator while present', () => {
    expect(resolveHost({ hostUid: 'mm' }, roster)).toBe('mm')
  })
  it('falls back to the earliest player when the creator left or is unknown', () => {
    expect(resolveHost({ hostUid: 'gone' }, roster)).toBe('zz')
    expect(resolveHost({}, roster)).toBe('zz')
    expect(resolveHost(null, [])).toBeNull()
  })
})

describe('extractRoomCode', () => {
  it('reads room and join links', () => {
    expect(extractRoomCode('https://spythegame.app/#/join/ab3d')).toBe('AB3D')
    expect(extractRoomCode('https://x.web.app/#/room/QWER')).toBe('QWER')
  })
  it('accepts a bare code', () => {
    expect(extractRoomCode(' wxyz ')).toBe('WXYZ')
  })
  it('rejects anything else', () => {
    expect(extractRoomCode('https://x.app/#/room/TOOLONG')).toBeNull()
    expect(extractRoomCode('hello')).toBeNull()
  })
})
