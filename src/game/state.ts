import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  CustomList,
  Difficulty,
  GameState,
  GameSettings,
  Pair,
} from './types'
import { BUILTIN_CATEGORY_IDS, samplePair } from './pairs'
import { normalizeSpyCount, startRoundState } from './machine'
import { AVATARS, avatarForIndex, nextAvatar } from '../data/avatars'
import { DEFAULT_LIST_ICON, isListIcon } from './icons'

const DEFAULT_SETTINGS: GameSettings = {
  timerSeconds: 0,
  pairSource: { selectedCategoryIds: [...BUILTIN_CATEGORY_IDS] },
  difficulty: 'close',
  spyCount: [1],
  spiesKnowEachOther: false,
}

const ROUND_RESET = {
  phase: 'lobby',
  pair: null,
  revealIndex: 0,
  firstClueGiverId: null,
} satisfies Partial<GameState>

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
  activeRoom: '',
}

type Actions = {
  addPlayer: (name: string) => void
  removePlayer: (id: string) => void
  renamePlayer: (id: string, name: string) => void
  /** Reorder the roster; cards are dealt in this order, so it should match the seating. */
  movePlayer: (from: number, to: number) => void
  cycleAvatar: (id: string) => void
  setSettings: (patch: Partial<GameSettings>) => void
  toggleCategory: (id: string) => void
  selectAllCategories: () => void
  clearCategories: () => void
  upsertCustomList: (list: CustomList) => void
  deleteCustomList: (id: string) => void
  setOnlineName: (name: string) => void
  setJoinCode: (code: string) => void
  setActiveRoom: (code: string) => void
  /** Starts a round; returns an error message instead of throwing. */
  startRound: () => string | null
  setRevealIndex: (i: number) => void
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
            ...ROUND_RESET,
            players: [
              ...s.players.map((p) => ({ ...p, isSpy: false })),
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
        set((s) => ({
          ...ROUND_RESET,
          players: s.players
            .filter((p) => p.id !== id)
            .map((p) => ({ ...p, isSpy: false })),
        })),

      renamePlayer: (id, name) =>
        set((s) => ({
          players: s.players.map((p) => (p.id === id ? { ...p, name } : p)),
        })),

      movePlayer: (from, to) =>
        set((s) => {
          const n = s.players.length
          if (from === to || from < 0 || from >= n || to < 0 || to >= n) return s
          const players = [...s.players]
          const [moved] = players.splice(from, 1)
          players.splice(to, 0, moved)
          return { players }
        }),

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
      setActiveRoom: (code) => set({ activeRoom: code }),

      startRound: () => {
        const { players, settings, customLists, round } = get()
        try {
          const pair: Pair = samplePair(
            settings.pairSource,
            customLists,
            settings.difficulty,
          )
          set(startRoundState(players, pair, round, settings.spyCount))
          return null
        } catch (e) {
          return e instanceof Error ? e.message : String(e)
        }
      },

      setRevealIndex: (i) =>
        set((s) => ({
          revealIndex: Math.max(0, Math.min(i, s.players.length - 1)),
        })),

      goToDiscussion: () => set({ phase: 'discussion' }),
      revealAnswer: () => set({ phase: 'result' }),

      playAgainSamePlayers: () => {
        const { players } = get()
        set({
          ...ROUND_RESET,
          players: players.map((p) => ({ ...p, isSpy: false })),
        })
      },

      resetAll: () => set({ ...INITIAL }),
    }),
    {
      name: 'spy-the-game-local',
      version: 9,
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
              spyCount: [1],
              spiesKnowEachOther: false,
            },
          }
        }
        if (fromVersion < 6) {
          // Difficulty collapsed from 4 tiers to 3: 'none' → 'easy' (both = no hint).
          const prev = (p?.settings as Omit<Partial<GameSettings>, 'difficulty'> & {
            difficulty?: string
          }) ?? {}
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
        if (fromVersion < 7) {
          // Custom list icons moved from emoji to icon keys.
          const lists = Array.isArray(p?.customLists)
            ? (p.customLists as CustomList[])
            : []
          p = {
            ...p,
            customLists: lists.map((l) => ({
              ...l,
              icon: isListIcon(l.icon) ? l.icon : DEFAULT_LIST_ICON,
            })),
          }
        }
        if (fromVersion < 8) {
          // Spy count became a set of allowed numbers (was a number or a {min,max} range).
          const prev = (p?.settings as Partial<GameSettings> & { spyCount?: unknown }) ?? {}
          p = {
            ...p,
            settings: {
              ...DEFAULT_SETTINGS,
              ...prev,
              spyCount: normalizeSpyCount(prev.spyCount),
            },
          }
        }
        if (fromVersion < 9) {
          // Hint levels now follow the word bank: hard/medium/easy → word/close/none.
          const prev = (p?.settings as Partial<GameSettings> & { difficulty?: string }) ?? {}
          const map: Record<string, Difficulty> = { hard: 'word', medium: 'close', easy: 'none' }
          p = {
            ...p,
            settings: {
              ...DEFAULT_SETTINGS,
              ...prev,
              difficulty: map[prev.difficulty ?? ''] ?? DEFAULT_SETTINGS.difficulty,
            },
          }
        }
        return p as unknown
      },
      // The running round is persisted too, so a reload or an accidental
      // back-swipe never loses who the spy is.
      partialize: (s) => ({
        players: s.players.map((p) => ({
          id: p.id,
          name: p.name,
          isSpy: p.isSpy,
          avatar: p.avatar,
        })),
        phase: s.phase,
        pair: s.pair,
        revealIndex: s.revealIndex,
        firstClueGiverId: s.firstClueGiverId,
        round: s.round,
        settings: s.settings,
        customLists: s.customLists,
        onlineName: s.onlineName,
        activeRoom: s.activeRoom,
      }),
    },
  ),
)
