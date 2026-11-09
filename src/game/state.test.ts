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
