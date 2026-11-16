import { describe, expect, it, vi } from 'vitest'

vi.mock('../i18n', () => ({ default: { language: 'en', t: (k: string) => k } }))

// Node has no window.localStorage; persist needs one to be active at all.
const store = new Map<string, string>()
const storage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
}
vi.stubGlobal('window', { localStorage: storage })
vi.stubGlobal('localStorage', storage)

const { useGame } = await import('./state')

describe('persisted game state', () => {
  it('keeps every setting, the roster, custom lists and the running round', () => {
    const s = useGame.getState()
    s.addPlayer('Anna')
    s.setSettings({
      timerSeconds: 300,
      difficulty: 'none',
      spyCount: [1, 2],
      spiesKnowEachOther: true,
      civiliansSeeHint: true,
      unawareSpy: true,
      pairSource: { selectedCategoryIds: ['animals'] },
    })
    s.setOnlineName('Agent')
    s.upsertCustomList({ id: 'l1', name: 'Mine', icon: 'star', pairs: [], createdAt: 0 })

    const saved = JSON.parse(store.get('spy-the-game-local')!).state
    expect(saved.settings).toEqual(useGame.getState().settings)
    expect(saved.customLists).toEqual(useGame.getState().customLists)
    expect(saved.onlineName).toBe('Agent')
    expect(saved.players).toEqual(useGame.getState().players)
    for (const key of ['phase', 'pair', 'revealIndex', 'firstClueGiverId', 'round']) {
      expect(saved).toHaveProperty(key)
    }
  })

  it.each([
    ['hard', 'word'],
    ['medium', 'close'],
    ['easy', 'none'],
    [undefined, 'close'],
  ])('migrates saved hint level %s to %s', (old, now) => {
    const migrate = useGame.persist.getOptions().migrate!
    const p = migrate({ settings: { difficulty: old } }, 8) as {
      settings: { difficulty: string }
    }
    expect(p.settings.difficulty).toBe(now)
  })

  it('adds the civilians-see-hint setting, off, to older saves without touching the rest', () => {
    const migrate = useGame.persist.getOptions().migrate!
    const p = migrate({ settings: { difficulty: 'word', spiesKnowEachOther: true } }, 9) as {
      settings: { difficulty: string; spiesKnowEachOther: boolean; civiliansSeeHint: boolean }
    }
    expect(p.settings).toMatchObject({ difficulty: 'word', spiesKnowEachOther: true, civiliansSeeHint: false })
  })

  it('adds the unaware-spy setting, off, to older saves without touching the rest', () => {
    const migrate = useGame.persist.getOptions().migrate!
    const p = migrate({ settings: { difficulty: 'close', civiliansSeeHint: true } }, 10) as {
      settings: { difficulty: string; civiliansSeeHint: boolean; unawareSpy: boolean }
    }
    expect(p.settings).toMatchObject({ difficulty: 'close', civiliansSeeHint: true, unawareSpy: false })
  })

  it('sets a preset picture for one player and ignores anything else', async () => {
    const { AVATARS } = await import('../data/avatars')
    const s = useGame.getState()
    s.addPlayer('Pic A')
    s.addPlayer('Pic B')
    const [a, b] = useGame.getState().players.slice(-2)
    s.setAvatar(a.id, AVATARS[7])
    s.setAvatar(b.id, 'https://example.com/x.png')
    const after = useGame.getState().players.slice(-2)
    expect(after[0].avatar).toBe(AVATARS[7])
    expect(after[1].avatar).toBe(b.avatar)
  })

  it('reorders players without touching anyone else', () => {
    const s = useGame.getState()
    s.addPlayer('B')
    s.addPlayer('C')
    const names = () => useGame.getState().players.map((p) => p.name)
    const before = names()
    useGame.getState().movePlayer(before.length - 1, 0)
    expect(names()).toEqual([before.at(-1), ...before.slice(0, -1)])
    useGame.getState().movePlayer(0, 99)
    expect(names()).toEqual([before.at(-1), ...before.slice(0, -1)])
  })
})

describe('account sync bookkeeping', () => {
  it('stamps settings changes so the newest wins on another device', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000)
    useGame.getState().setSettings({ timerSeconds: 120 })
    expect(useGame.getState().settingsUpdatedAt).toBe(1000)
    vi.spyOn(Date, 'now').mockReturnValue(2000)
    useGame.getState().toggleCategory('food')
    expect(useGame.getState().settingsUpdatedAt).toBe(2000)
    vi.restoreAllMocks()
  })

  it('stamps list edits and remembers deletes until the list is saved again', () => {
    vi.spyOn(Date, 'now').mockReturnValue(3000)
    const s = useGame.getState()
    s.upsertCustomList({ id: 'sync1', name: 'S', icon: 'star', pairs: [], createdAt: 1 })
    expect(useGame.getState().customLists.find((l) => l.id === 'sync1')?.updatedAt).toBe(3000)
    vi.spyOn(Date, 'now').mockReturnValue(4000)
    useGame.getState().deleteCustomList('sync1')
    expect(useGame.getState().deletedLists.sync1).toBe(4000)
    useGame.getState().upsertCustomList({ id: 'sync1', name: 'S', icon: 'star', pairs: [], createdAt: 1 })
    expect(useGame.getState().deletedLists.sync1).toBeUndefined()
    vi.restoreAllMocks()
  })

  it('persists the account and sync stamps', () => {
    useGame.getState().setAccount({ uid: 'u1', name: 'N', email: 'n@example.com' })
    const saved = JSON.parse(store.get('spy-the-game-local')!).state
    expect(saved.account).toEqual({ uid: 'u1', name: 'N', email: 'n@example.com' })
    expect(typeof saved.settingsUpdatedAt).toBe('number')
    expect(saved.deletedLists).toBeDefined()
  })
})
