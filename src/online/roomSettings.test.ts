import { describe, expect, it, vi } from 'vitest'
import type { CustomList, GameSettings } from '../game/types'
import type { RoomSettings } from './roomSettings'

// The real i18n setup touches the DOM; these tests only need the pure helpers.
vi.mock('../i18n', () => ({ default: { language: 'en', t: (k: string) => k } }))

const { BUILTIN_CATEGORY_IDS } = await import('../game/pairs')
const {
  clearRoomCategories,
  normalizeRoomSettings,
  seedRoomSettings,
  selectAllRoomCategories,
  toRoomData,
  toggleRoomCategory,
  visibleRoomLists,
} = await import('./roomSettings')

const list = (id: string, createdAt = 1, civilian = 'Cat'): CustomList => ({
  id,
  name: `List ${id}`,
  icon: 'star',
  pairs: [{ civilian, spy: 'Dog' }],
  createdAt,
})

const settings: GameSettings = {
  timerSeconds: 180,
  difficulty: 'word',
  spyCount: [1, 2],
  spiesKnowEachOther: true,
  pairSource: { selectedCategoryIds: [BUILTIN_CATEGORY_IDS[0], 'custom:a'] },
}

describe('normalizeRoomSettings', () => {
  it('is null for a room without settings', () => {
    expect(normalizeRoomSettings(null)).toBeNull()
    expect(normalizeRoomSettings(undefined)).toBeNull()
  })

  it('round-trips through the database shape', () => {
    const rs: RoomSettings = { settings, lists: [list('a'), list('b', 2)] }
    expect(normalizeRoomSettings(toRoomData(rs))).toEqual(rs)
  })

  it('fills what RTDB drops (empty arrays) and rejects junk', () => {
    const rs = normalizeRoomSettings({ difficulty: 'bogus', timerSeconds: -5 })!
    expect(rs.settings).toEqual({
      timerSeconds: 0,
      difficulty: 'close',
      spyCount: [1],
      spiesKnowEachOther: false,
      pairSource: { selectedCategoryIds: [] },
    })
    expect(rs.lists).toEqual([])
  })

  it('reads arrays that come back as objects', () => {
    const rs = normalizeRoomSettings({
      spyCount: { 0: 2, 1: 3 },
      categories: { 0: 'x', 2: 'y' },
      lists: { a: { name: 'A', icon: 'star', createdAt: 1, pairs: { 1: { civilian: 'C', spy: 'S' }, 2: 'junk' } } },
    })!
    expect(rs.settings.spyCount).toEqual([2, 3])
    expect(rs.settings.pairSource.selectedCategoryIds).toEqual(['x', 'y'])
    expect(rs.lists[0].pairs).toEqual([{ civilian: 'C', spy: 'S' }])
  })
})

describe('seedRoomSettings', () => {
  it('copies only the selected local lists and drops unknown ids', () => {
    const rs = seedRoomSettings(
      {
        ...settings,
        pairSource: { selectedCategoryIds: [...settings.pairSource.selectedCategoryIds, 'custom:gone'] },
      },
      [list('a'), list('b')],
    )
    expect(rs.lists.map((l) => l.id)).toEqual(['a'])
    expect(rs.settings.pairSource.selectedCategoryIds).toEqual([BUILTIN_CATEGORY_IDS[0], 'custom:a'])
    expect(rs.settings.timerSeconds).toBe(180)
  })
})

describe('room category editing', () => {
  const base: RoomSettings = {
    settings: { ...settings, pairSource: { selectedCategoryIds: [] } },
    lists: [list('shared', 1, 'Old')],
  }

  it('shows the room copies first, then unshared local lists', () => {
    expect(visibleRoomLists(base, [list('shared', 1, 'New'), list('mine', 5)]).map((l) => [l.id, l.pairs[0].civilian])).toEqual([
      ['shared', 'Old'],
      ['mine', 'Cat'],
    ])
  })

  it('picking an own list shares (or refreshes) it', () => {
    const on = toggleRoomCategory(base, 'custom:shared', [list('shared', 1, 'New')])
    expect(on.settings.pairSource.selectedCategoryIds).toEqual(['custom:shared'])
    expect(on.lists[0].pairs[0].civilian).toBe('New')
    const mine = toggleRoomCategory(on, 'custom:mine', [list('mine')])
    expect(mine.lists.map((l) => l.id)).toEqual(['shared', 'mine'])
  })

  it('unpicking keeps the copy so others can still pick it', () => {
    const on = toggleRoomCategory(base, 'custom:shared', [])
    expect(on.lists).toBe(base.lists)
    const off = toggleRoomCategory(on, 'custom:shared', [])
    expect(off.settings.pairSource.selectedCategoryIds).toEqual([])
    expect(off.lists).toHaveLength(1)
  })

  it('select all covers built-ins, room lists and own lists; clear empties', () => {
    const all = selectAllRoomCategories(base, [list('mine')])
    expect(all.settings.pairSource.selectedCategoryIds).toEqual([
      ...BUILTIN_CATEGORY_IDS,
      'custom:shared',
      'custom:mine',
    ])
    expect(all.lists.map((l) => l.id)).toEqual(['shared', 'mine'])
    expect(clearRoomCategories(all).settings.pairSource.selectedCategoryIds).toEqual([])
  })
})
