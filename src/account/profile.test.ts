import { describe, expect, it, vi } from 'vitest'

vi.mock('../i18n', () => ({ default: { language: 'en', t: (k: string) => k } }))

import type { CustomList, GameSettings } from '../game/types'
import {
  mergeProfiles,
  normalizeProfile,
  orderLists,
  profileFromState,
  remoteUpdates,
  type Profile,
} from './profile'

const SETTINGS: GameSettings = {
  timerSeconds: 0,
  pairSource: { selectedCategoryIds: ['animals'] },
  difficulty: 'close',
  spyCount: [1],
  spiesKnowEachOther: false,
  civiliansSeeHint: false,
  unawareSpy: false,
}

function list(id: string, stamp: number, name = id): CustomList {
  return { id, name, icon: 'star', pairs: [{ civilian: 'a', spy: 'b' }], createdAt: 1, updatedAt: stamp }
}

function profile(p: Partial<Profile> = {}): Profile {
  return { settings: SETTINGS, settingsUpdatedAt: 0, lists: {}, deleted: {}, ...p }
}

describe('mergeProfiles', () => {
  it('keeps local as is when the account has nothing yet', () => {
    const local = profile({ lists: { a: list('a', 5) } })
    expect(mergeProfiles(local, null)).toBe(local)
  })

  it('takes the newer settings as a whole', () => {
    const local = profile({ settings: { ...SETTINGS, timerSeconds: 60 }, settingsUpdatedAt: 10 })
    const remote = profile({ settings: { ...SETTINGS, difficulty: 'none' }, settingsUpdatedAt: 20 })
    const merged = mergeProfiles(local, remote)
    expect(merged.settings.difficulty).toBe('none')
    expect(merged.settings.timerSeconds).toBe(0)
    expect(merged.settingsUpdatedAt).toBe(20)
    expect(mergeProfiles(remote, local).settings.difficulty).toBe('none')
  })

  it('unions lists and keeps the newer copy of each', () => {
    const local = profile({ lists: { a: list('a', 5, 'old'), b: list('b', 1) } })
    const remote = profile({ lists: { a: list('a', 9, 'new'), c: list('c', 1) } })
    const merged = mergeProfiles(local, remote)
    expect(Object.keys(merged.lists).sort()).toEqual(['a', 'b', 'c'])
    expect(merged.lists.a.name).toBe('new')
  })

  it('falls back to createdAt for lists saved before updatedAt existed', () => {
    const legacy: CustomList = { id: 'a', name: 'legacy', icon: 'star', pairs: [], createdAt: 50 }
    const merged = mergeProfiles(profile({ lists: { a: legacy } }), profile({ lists: { a: list('a', 40) } }))
    expect(merged.lists.a.name).toBe('legacy')
  })

  it('does not bring back a list deleted on another device', () => {
    const local = profile({ lists: { a: list('a', 5) } })
    const remote = profile({ deleted: { a: 7 } })
    const merged = mergeProfiles(local, remote)
    expect(merged.lists.a).toBeUndefined()
    expect(merged.deleted.a).toBe(7)
  })

  it('keeps a list edited after it was deleted elsewhere, and drops the tombstone', () => {
    const merged = mergeProfiles(profile({ lists: { a: list('a', 9) } }), profile({ deleted: { a: 7 } }))
    expect(merged.lists.a).toBeDefined()
    expect(merged.deleted.a).toBeUndefined()
  })

  it('unselects deleted lists', () => {
    const local = profile({
      settings: { ...SETTINGS, pairSource: { selectedCategoryIds: ['animals', 'custom:a'] } },
      settingsUpdatedAt: 99,
      lists: { a: list('a', 1) },
    })
    const merged = mergeProfiles(local, profile({ deleted: { a: 5 } }))
    expect(merged.settings.pairSource.selectedCategoryIds).toEqual(['animals'])
  })

  it('keeps lists from the older side selected if they were selected there', () => {
    const local = profile({
      settings: { ...SETTINGS, pairSource: { selectedCategoryIds: ['custom:mine'] } },
      settingsUpdatedAt: 1,
      lists: { mine: list('mine', 1) },
    })
    const remote = profile({ settingsUpdatedAt: 50, lists: { theirs: list('theirs', 1) } })
    const merged = mergeProfiles(local, remote)
    expect(merged.settings.pairSource.selectedCategoryIds).toEqual(['animals', 'custom:mine'])
  })

  it('gives the same result whichever device merges', () => {
    const a = profile({ settingsUpdatedAt: 3, lists: { x: list('x', 4), y: list('y', 2) }, deleted: { z: 9 } })
    const b = profile({ settingsUpdatedAt: 8, lists: { x: list('x', 6), z: list('z', 1) }, deleted: { y: 3 } })
    expect(mergeProfiles(a, b)).toEqual(mergeProfiles(b, a))
  })
})

describe('normalizeProfile', () => {
  it('returns null for an empty account', () => {
    expect(normalizeProfile(null)).toBeNull()
  })

  it('restores what the database dropped or reshaped', () => {
    const p = normalizeProfile({
      settings: { difficulty: 'word', pairSource: {}, spyCount: { 0: 1, 2: 3 } },
      settingsUpdatedAt: 4,
      lists: { a: { name: 'A', icon: 'nope', createdAt: 2 }, bad: { pairs: [] } },
      deleted: { b: 3, junk: 'x' },
    })!
    expect(p.settings.pairSource.selectedCategoryIds).toEqual([])
    expect(p.settings.difficulty).toBe('word')
    expect(p.settings.spyCount).toEqual([1, 3])
    expect(p.lists.a).toEqual({ id: 'a', name: 'A', icon: 'layers', pairs: [], createdAt: 2 })
    expect(p.lists.bad).toBeUndefined()
    expect(p.deleted).toEqual({ b: 3 })
  })

  it('rejects an unknown hint level', () => {
    expect(normalizeProfile({ settings: { difficulty: 'evil' } })!.settings.difficulty).toBe('close')
  })
})

describe('remoteUpdates', () => {
  it('writes everything for a new account', () => {
    const p = profile({ lists: { a: list('a', 1) } })
    expect(remoteUpdates(null, p)).toEqual({
      settings: SETTINGS,
      settingsUpdatedAt: 0,
      'lists/a': p.lists.a,
    })
  })

  it('writes nothing when in sync, even with keys in another order', () => {
    const p = profile({ lists: { a: list('a', 1) } })
    const reordered = normalizeProfile(JSON.parse(JSON.stringify(p)))!
    expect(remoteUpdates(reordered, p)).toEqual({})
  })

  it('writes only the lists that changed, and removes deleted ones', () => {
    const remote = profile({ lists: { a: list('a', 1), b: list('b', 1) } })
    const next = profile({ lists: { a: list('a', 2), b: list('b', 1) }, deleted: {} })
    delete next.lists.b
    next.deleted.b = 5
    expect(remoteUpdates(remote, next)).toEqual({
      'lists/a': next.lists.a,
      'lists/b': null,
      'deleted/b': 5,
    })
  })
})

describe('profileFromState / orderLists', () => {
  it('leaves out lists whose id cannot be a database key', () => {
    const p = profileFromState({
      settings: SETTINGS,
      settingsUpdatedAt: 0,
      customLists: [list('ok', 1), list('a/b', 1)],
      deletedLists: {},
    })
    expect(Object.keys(p.lists)).toEqual(['ok'])
  })

  it('keeps local order and appends new lists oldest first', () => {
    const current = [list('b', 1), list('a', 1)]
    const c = { ...list('c', 1), createdAt: 9 }
    const d = { ...list('d', 1), createdAt: 3 }
    const ordered = orderLists(current, { a: list('a', 2), c, d })
    expect(ordered.map((l) => l.id)).toEqual(['a', 'd', 'c'])
  })
})
