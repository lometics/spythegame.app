import { describe, expect, it } from 'vitest'
import {
  assignRoles,
  availableSpyCounts,
  clueOrder,
  maxSpiesFor,
  normalizeSpyCount,
  resolveSpyCount,
  toggleSpyCount,
} from './machine'
import type { Player } from './types'

const players = (n: number): Player[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    name: `P${i}`,
    isSpy: false,
    avatar: '',
  }))

describe('maxSpiesFor', () => {
  it('keeps civilians a strict majority', () => {
    expect(maxSpiesFor(3)).toBe(1)
    expect(maxSpiesFor(4)).toBe(1)
    expect(maxSpiesFor(5)).toBe(2)
    expect(maxSpiesFor(8)).toBe(3)
  })
})

describe('availableSpyCounts', () => {
  it('keeps the selected counts that fit, ascending and unique', () => {
    expect(availableSpyCounts([3, 1, 2, 2], 7)).toEqual([1, 2, 3])
    expect(availableSpyCounts([1, 2, 3], 5)).toEqual([1, 2])
  })
  it('falls back to the most spies allowed when nothing selected fits', () => {
    expect(availableSpyCounts([3], 5)).toEqual([2])
    expect(availableSpyCounts([2, 3], 4)).toEqual([1])
  })
})

describe('resolveSpyCount', () => {
  it('only ever picks one of the allowed counts', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 300; i++) seen.add(resolveSpyCount([1, 3], 9))
    expect([...seen].sort()).toEqual([1, 3])
  })
  it('uses a single selection every time', () => {
    for (let i = 0; i < 20; i++) expect(resolveSpyCount([2], 6)).toBe(2)
  })
})

describe('toggleSpyCount', () => {
  it('adds and removes counts', () => {
    expect(toggleSpyCount([1], 3)).toEqual([1, 3])
    expect(toggleSpyCount([1, 3], 1)).toEqual([3])
  })
  it('never removes the last count', () => {
    expect(toggleSpyCount([2], 2)).toEqual([2])
  })
})

describe('normalizeSpyCount', () => {
  it('reads old saved shapes', () => {
    expect(normalizeSpyCount(2)).toEqual([2])
    expect(normalizeSpyCount({ min: 1, max: 3 })).toEqual([1, 2, 3])
    expect(normalizeSpyCount([2, 'x', 0])).toEqual([2])
    expect(normalizeSpyCount(undefined)).toEqual([1])
  })
})

describe('assignRoles', () => {
  it('assigns exactly the resolved number of spies', () => {
    const out = assignRoles(players(7), [3])
    expect(out.filter((p) => p.isSpy)).toHaveLength(3)
    expect(out.map((p) => p.id)).toEqual(players(7).map((p) => p.id))
  })
  it('rejects fewer than 3 players', () => {
    expect(() => assignRoles(players(2))).toThrow()
  })
})

describe('clueOrder', () => {
  it('rotates so the first clue giver leads', () => {
    expect(clueOrder(players(4), 'p2').map((p) => p.id)).toEqual(['p2', 'p3', 'p0', 'p1'])
  })
  it('keeps order for an unknown or first id', () => {
    expect(clueOrder(players(3), 'nope').map((p) => p.id)).toEqual(['p0', 'p1', 'p2'])
    expect(clueOrder(players(3), null).map((p) => p.id)).toEqual(['p0', 'p1', 'p2'])
  })
})
