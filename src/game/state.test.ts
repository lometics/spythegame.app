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
      difficulty: 'easy',
      spyCount: [1, 2],
      spiesKnowEachOther: true,
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
