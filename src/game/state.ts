import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  CustomList,
  GameState,
  GameSettings,
  Pair,
} from './types'
import { BUILTIN_CATEGORY_IDS, samplePair } from './pairs'
import { startRoundState } from './machine'
import { AVATARS, avatarForIndex, nextAvatar } from '../data/avatars'

const DEFAULT_SETTINGS: GameSettings = {
  timerSeconds: 180,
  pairSource: { selectedCategoryIds: [...BUILTIN_CATEGORY_IDS] },
  difficulty: 'hard',
  spyCount: 1,
  spiesKnowEachOther: false,
}

const INITIAL: GameState = {
  players: [],
  phase: 'lobby',
  pair: null,
  revealIndex: 0,
  firstClueGiverId: null,
  round: 0,
  settings: DEFAULT_SETTINGS,
  customLists: [],
  onlineName: '',
  joinCode: '',
}

type Actions = {
  addPlayer: (name: string) => void
  removePlayer: (id: string) => void
  renamePlayer: (id: string, name: string) => void
  cycleAvatar: (id: string) => void
  setSettings: (patch: Partial<GameSettings>) => void
  toggleCategory: (id: string) => void
  selectAllCategories: () => void
  clearCategories: () => void
  upsertCustomList: (list: CustomList) => void
  deleteCustomList: (id: string) => void
  setOnlineName: (name: string) => void
  setJoinCode: (code: string) => void
  startRound: () => void
  advanceReveal: () => void
  goToDiscussion: () => void
  revealAnswer: () => void
  playAgainSamePlayers: () => void
  resetAll: () => void
}

export const useGame = create<GameState & Actions>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      addPlayer: (name) => {
        const trimmed = name.trim()
        if (!trimmed) return
        set((s) => {
          // Pick first avatar not yet used (else fall back to round-robin).
          const used = new Set(s.players.map((p) => p.avatar))
          const free = AVATARS.find((a) => !used.has(a))
          const avatar = free ?? avatarForIndex(s.players.length)
          return {
            players: [
              ...s.players,
              {
                id: crypto.randomUUID(),
                name: trimmed,
                isSpy: false,
                avatar,
              },
            ],
          }
        })
      },

      removePlayer: (id) =>
        set((s) => ({ players: s.players.filter((p) => p.id !== id) })),

      renamePlayer: (id, name) =>
        set((s) => ({
          players: s.players.map((p) => (p.id === id ? { ...p, name } : p)),
        })),

      cycleAvatar: (id) =>
        set((s) => ({
          players: s.players.map((p) =>
            p.id === id ? { ...p, avatar: nextAvatar(p.avatar) } : p,
          ),
        })),

      setSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      toggleCategory: (id) =>
        set((s) => {
          const current = s.settings.pairSource.selectedCategoryIds
          const exists = current.includes(id)
          return {
            settings: {
              ...s.settings,
              pairSource: {
                selectedCategoryIds: exists
                  ? current.filter((x) => x !== id)
                  : [...current, id],
              },
            },
          }
        }),

      selectAllCategories: () =>
        set((s) => ({
          settings: {
            ...s.settings,
            pairSource: {
              selectedCategoryIds: [
                ...BUILTIN_CATEGORY_IDS,
                ...s.customLists.map((l) => `custom:${l.id}`),
              ],
            },
          },
        })),

      clearCategories: () =>
        set((s) => ({
          settings: {
            ...s.settings,
            pairSource: { selectedCategoryIds: [] },
          },
        })),

      upsertCustomList: (list) =>
        set((s) => {
          const existing = s.customLists.findIndex((l) => l.id === list.id)
          const customLists =
            existing >= 0
              ? s.customLists.map((l, i) => (i === existing ? list : l))
              : [...s.customLists, list]
          // Auto-select new custom lists so they're included by default
          const cid = `custom:${list.id}`
          const selected = s.settings.pairSource.selectedCategoryIds
          const selectedCategoryIds =
            existing >= 0 || selected.includes(cid)
              ? selected
              : [...selected, cid]
          return {
            customLists,
            settings: {
              ...s.settings,
              pairSource: { selectedCategoryIds },
            },
          }
        }),

      deleteCustomList: (id) =>
        set((s) => {
          const cid = `custom:${id}`
          return {
            customLists: s.customLists.filter((l) => l.id !== id),
            settings: {
              ...s.settings,
              pairSource: {
                selectedCategoryIds:
                  s.settings.pairSource.selectedCategoryIds.filter(
                    (x) => x !== cid,
                  ),
              },
            },
          }
        }),

      setOnlineName: (name) => set({ onlineName: name }),
      setJoinCode: (code) => set({ joinCode: code.toUpperCase() }),

      startRound: () => {
        const { players, settings, customLists, round } = get()
        const pair: Pair = samplePair(
          settings.pairSource,
          customLists,
          settings.difficulty,
        )
        set((s) => ({
          ...s,
          ...startRoundState(players, pair, round, settings.spyCount),
        }))
      },

      advanceReveal: () => {
        const { revealIndex, players } = get()
        if (revealIndex + 1 >= players.length) {
          set({ phase: 'discussion' })
        } else {
          set({ revealIndex: revealIndex + 1 })
        }
      },

      goToDiscussion: () => set({ phase: 'discussion' }),
      revealAnswer: () => set({ phase: 'result' }),

      playAgainSamePlayers: () => {
        const { players } = get()
        set({
          players: players.map((p) => ({ ...p, isSpy: false })),
          phase: 'lobby',
          pair: null,
          revealIndex: 0,
          firstClueGiverId: null,
        })
      },

      resetAll: () => set({ ...INITIAL }),
    }),
    {
      name: 'spy-the-game-local',
      version: 6,
      // Drop old persisted state on schema change so we don't ship users a half-broken settings object.
      migrate: (persisted, fromVersion) => {
        let p = persisted as Record<string, unknown>
        if (fromVersion < 2) {
          p = {
            players: Array.isArray(p?.players)
              ? (p.players as Array<{ id: string; name: string }>)
                  .filter((pl) => pl && typeof pl.id === 'string')
                  .map((pl) => ({ id: pl.id, name: pl.name, isSpy: false }))
              : [],
            settings: DEFAULT_SETTINGS,
            customLists: [],
          }
        }
        if (fromVersion < 3) {
          p = {
            ...p,
            settings: {
              ...DEFAULT_SETTINGS,
              ...((p?.settings as Partial<GameSettings>) ?? {}),
            },
          }
        }
        if (fromVersion < 4) {
          const players = Array.isArray(p?.players)
            ? (p.players as Array<{ id: string; name: string; avatar?: string }>).map(
                (pl, i) => ({
                  id: pl.id,
                  name: pl.name,
                  isSpy: false,
                  avatar: pl.avatar ?? avatarForIndex(i),
                }),
              )
            : []
          p = { ...p, players }
        }
        if (fromVersion < 5) {
          p = {
            ...p,
            settings: {
              ...DEFAULT_SETTINGS,
              ...((p?.settings as Partial<GameSettings>) ?? {}),
              spyCount: 1,
              spiesKnowEachOther: false,
            },
          }
        }
        if (fromVersion < 6) {
          // Difficulty collapsed from 4 tiers to 3: 'none' → 'easy' (both = no hint).
          const prev = (p?.settings as Partial<GameSettings> & { difficulty?: string }) ?? {}
          const remapped =
            prev.difficulty === 'none' ? 'easy' : prev.difficulty
          p = {
            ...p,
            settings: {
              ...DEFAULT_SETTINGS,
              ...prev,
              difficulty:
                remapped === 'easy' || remapped === 'medium' || remapped === 'hard'
                  ? remapped
                  : 'hard',
            },
          }
        }
        return p as unknown
      },
      partialize: (s) => ({
        players: s.players.map((p) => ({
          id: p.id,
          name: p.name,
          isSpy: false,
          avatar: p.avatar,
        })),
        settings: s.settings,
        customLists: s.customLists,
        onlineName: s.onlineName,
      }),
    },
  ),
)
