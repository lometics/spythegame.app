import { describe, expect, it } from 'vitest'
import { extractRoomCode, sortedRoster } from './roster'

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
