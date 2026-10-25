import type { CustomList, Difficulty, GameSettings } from '../game/types'
import { DIFFICULTIES } from '../game/types'
import { BUILTIN_CATEGORY_IDS, customCategoryId } from '../game/pairs'
import { normalizeSpyCount } from '../game/machine'

/**
 * The one set of round settings a room shares; anyone in the room can change
 * it. Custom word lists only exist on the device that made them, so the room
 * keeps its own copy of every list someone picked, and every player can use it.
 */
export type RoomSettings = {
  settings: GameSettings
  lists: CustomList[]
}

/** How it sits in the database (`rooms/$code/settings`). */
export type RoomSettingsData = {
  timerSeconds: number
  difficulty: Difficulty
  spyCount: number[]
  spiesKnowEachOther: boolean
  categories: string[]
  lists: Record<string, Omit<CustomList, 'id'>>
}

/** Last settings seen per room, so a setup page opened from the lobby shows them at once. */
export const roomSettingsCache = new Map<string, RoomSettings>()

const asStrings = (v: unknown): string[] =>
  (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : []).filter(
    (x): x is string => typeof x === 'string',
  )

function normalizeList(id: string, raw: unknown): CustomList | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.name !== 'string') return null
  // RTDB hands back arrays as objects when they have gaps, and drops empty ones.
  const rawPairs = Array.isArray(r.pairs)
    ? r.pairs
    : r.pairs && typeof r.pairs === 'object'
      ? Object.values(r.pairs)
      : []
  const pairs = rawPairs.flatMap((p) => {
    const q = p as { civilian?: unknown; spy?: unknown } | null
    return q && typeof q.civilian === 'string' && typeof q.spy === 'string'
      ? [{ civilian: q.civilian, spy: q.spy }]
      : []
  })
  return {
    id,
    name: r.name,
    icon: typeof r.icon === 'string' ? r.icon : '',
    pairs,
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : 0,
  }
}

/** Reads the settings node; null when the room has none yet (made by an older build). */
export function normalizeRoomSettings(raw: unknown): RoomSettings | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const lists =
    r.lists && typeof r.lists === 'object'
      ? Object.entries(r.lists as Record<string, unknown>)
          .map(([id, l]) => normalizeList(id, l))
          .filter((l): l is CustomList => l !== null)
          .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))
      : []
  const timer = Number(r.timerSeconds)
  return {
    settings: {
      timerSeconds: Number.isFinite(timer) && timer > 0 ? timer : 0,
      difficulty: DIFFICULTIES.includes(r.difficulty as Difficulty)
        ? (r.difficulty as Difficulty)
        : 'close',
      spyCount: normalizeSpyCount(
        r.spyCount && typeof r.spyCount === 'object' && !Array.isArray(r.spyCount)
          ? Object.values(r.spyCount)
          : r.spyCount,
      ),
      spiesKnowEachOther: r.spiesKnowEachOther === true,
      pairSource: { selectedCategoryIds: asStrings(r.categories) },
    },
    lists,
  }
}

export function toRoomData({ settings, lists }: RoomSettings): RoomSettingsData {
  return {
    timerSeconds: settings.timerSeconds,
    difficulty: settings.difficulty,
    spyCount: settings.spyCount,
    spiesKnowEachOther: settings.spiesKnowEachOther,
    categories: settings.pairSource.selectedCategoryIds,
    lists: Object.fromEntries(
      lists.map(({ id, ...rest }) => [
        id,
        { ...rest, pairs: rest.pairs.map(({ civilian, spy }) => ({ civilian, spy })) },
      ]),
    ),
  }
}

/** A new room starts with the creator's settings and copies of the lists they picked. */
export function seedRoomSettings(
  settings: GameSettings,
  localLists: CustomList[],
): RoomSettings {
  const selected = settings.pairSource.selectedCategoryIds
  const lists = localLists.filter((l) => selected.includes(customCategoryId(l.id)))
  const known = new Set([
    ...BUILTIN_CATEGORY_IDS,
    ...lists.map((l) => customCategoryId(l.id)),
  ])
  return {
    settings: {
      ...settings,
      pairSource: { selectedCategoryIds: selected.filter((id) => known.has(id)) },
    },
    lists,
  }
}

/** Puts (or refreshes) the copy of a local list in the room. */
function share(lists: CustomList[], list: CustomList): CustomList[] {
  return lists.some((l) => l.id === list.id)
    ? lists.map((l) => (l.id === list.id ? list : l))
    : [...lists, list]
}

/** Lists a player can pick from in the room: the room's copies, then their own unshared ones. */
export function visibleRoomLists(rs: RoomSettings, localLists: CustomList[]): CustomList[] {
  const inRoom = new Set(rs.lists.map((l) => l.id))
  return [...rs.lists, ...localLists.filter((l) => !inRoom.has(l.id))]
}

export function toggleRoomCategory(
  rs: RoomSettings,
  id: string,
  localLists: CustomList[],
): RoomSettings {
  const current = rs.settings.pairSource.selectedCategoryIds
  const on = !current.includes(id)
  // Picking your own list shares your current version of it with the room.
  const mine = on ? localLists.find((l) => customCategoryId(l.id) === id) : undefined
  return {
    settings: {
      ...rs.settings,
      pairSource: {
        selectedCategoryIds: on ? [...current, id] : current.filter((x) => x !== id),
      },
    },
    lists: mine ? share(rs.lists, mine) : rs.lists,
  }
}

export function selectAllRoomCategories(
  rs: RoomSettings,
  localLists: CustomList[],
): RoomSettings {
  const lists = localLists.reduce(share, rs.lists)
  return {
    settings: {
      ...rs.settings,
      pairSource: {
        selectedCategoryIds: [
          ...BUILTIN_CATEGORY_IDS,
          ...lists.map((l) => customCategoryId(l.id)),
        ],
      },
    },
    lists,
  }
}

export function clearRoomCategories(rs: RoomSettings): RoomSettings {
  return {
    ...rs,
    settings: { ...rs.settings, pairSource: { selectedCategoryIds: [] } },
  }
}
