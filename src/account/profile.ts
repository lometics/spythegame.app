// What a Google account keeps for its owner: game settings and own word lists.
// Pure functions only; the Firebase side lives in sync.ts.
//
// Merging rules (several devices can edit offline and sync later):
//  - settings: last change wins, as one block (settingsUpdatedAt)
//  - lists: per list, the newer copy wins (updatedAt, else createdAt)
//  - a deleted list leaves a tombstone (id → time); it beats any copy of the
//    list that was last changed before the delete, so it can't come back from
//    a device that still has it.
import type { CustomList, Difficulty, GameSettings } from '../game/types'
import { DIFFICULTIES } from '../game/types'
import { normalizeSpyCount } from '../game/machine'
import { DEFAULT_LIST_ICON, isListIcon } from '../game/icons'
import { DEFAULT_SETTINGS } from '../game/defaults'

export type Profile = {
  settings: GameSettings
  settingsUpdatedAt: number
  lists: Record<string, CustomList>
  /** Deleted list id → when it was deleted. */
  deleted: Record<string, number>
}

const CUSTOM = 'custom:'

/** Database keys can't contain these; list ids are UUIDs, but don't let a bad one break syncing. */
function isSafeKey(id: string): boolean {
  return id.length > 0 && id.length <= 128 && !/[.#$[\]/]/.test(id)
}

export function listStamp(l: CustomList): number {
  return l.updatedAt ?? l.createdAt ?? 0
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

/** The database returns some arrays as objects ({0: a, 2: b}) and drops empty ones. */
function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : []
}

function strings(v: unknown): string[] {
  return asArray(v).filter((x): x is string => typeof x === 'string')
}

function normalizeSettings(raw: unknown): GameSettings {
  if (!raw || typeof raw !== 'object') return DEFAULT_SETTINGS
  const s = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const pairSource = (s.pairSource ?? {}) as Record<string, unknown>
  return {
    timerSeconds: Math.max(0, num(s.timerSeconds, DEFAULT_SETTINGS.timerSeconds)),
    pairSource: {
      // Missing means none selected: the database drops empty lists.
      selectedCategoryIds: strings(pairSource.selectedCategoryIds),
    },
    difficulty: DIFFICULTIES.includes(s.difficulty as Difficulty)
      ? (s.difficulty as Difficulty)
      : DEFAULT_SETTINGS.difficulty,
    spyCount: normalizeSpyCount(asArray(s.spyCount)),
    spiesKnowEachOther: s.spiesKnowEachOther === true,
    civiliansSeeHint: s.civiliansSeeHint === true,
    unawareSpy: s.unawareSpy === true,
  }
}

function normalizeList(id: string, raw: unknown): CustomList | null {
  if (!raw || typeof raw !== 'object') return null
  const l = raw as Record<string, unknown>
  if (typeof l.name !== 'string') return null
  const pairs = (asArray(l.pairs) as Array<Record<string, unknown> | null>)
    .filter(
      (p): p is { civilian: string; spy: string } =>
        !!p && typeof p.civilian === 'string' && typeof p.spy === 'string',
    )
    .map((p) => ({ civilian: p.civilian, spy: p.spy }))
  const list: CustomList = {
    id,
    name: l.name,
    icon: typeof l.icon === 'string' && isListIcon(l.icon) ? l.icon : DEFAULT_LIST_ICON,
    pairs,
    createdAt: num(l.createdAt),
  }
  if (typeof l.updatedAt === 'number') list.updatedAt = l.updatedAt
  return list
}

/** Reads what the database holds for an account; null when there's nothing yet. */
export function normalizeProfile(raw: unknown): Profile | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const lists: Record<string, CustomList> = {}
  for (const [id, l] of Object.entries((r.lists ?? {}) as Record<string, unknown>)) {
    const list = normalizeList(id, l)
    if (list) lists[id] = list
  }
  const deleted: Record<string, number> = {}
  for (const [id, t] of Object.entries((r.deleted ?? {}) as Record<string, unknown>)) {
    if (typeof t === 'number') deleted[id] = t
  }
  return {
    settings: normalizeSettings(r.settings),
    settingsUpdatedAt: num(r.settingsUpdatedAt),
    lists,
    deleted,
  }
}

export function profileFromState(s: {
  settings: GameSettings
  settingsUpdatedAt: number
  customLists: CustomList[]
  deletedLists: Record<string, number>
}): Profile {
  return {
    settings: s.settings,
    settingsUpdatedAt: s.settingsUpdatedAt,
    lists: Object.fromEntries(s.customLists.filter((l) => isSafeKey(l.id)).map((l) => [l.id, l])),
    deleted: { ...s.deletedLists },
  }
}

/** Combines two copies of a profile. Order doesn't matter except for exact ties, where `b` wins. */
export function mergeProfiles(a: Profile, b: Profile | null): Profile {
  if (!b) return a
  const deleted: Record<string, number> = { ...a.deleted }
  for (const [id, t] of Object.entries(b.deleted)) deleted[id] = Math.max(deleted[id] ?? 0, t)

  const lists: Record<string, CustomList> = {}
  const ids = new Set([...Object.keys(a.lists), ...Object.keys(b.lists)])
  for (const id of ids) {
    const la = a.lists[id]
    const lb = b.lists[id]
    const pick = !la ? lb : !lb ? la : listStamp(la) > listStamp(lb) ? la : lb
    if (deleted[id] !== undefined && deleted[id] >= listStamp(pick)) continue
    lists[id] = pick
  }
  // A list edited after it was deleted elsewhere is alive again.
  for (const id of Object.keys(lists)) delete deleted[id]

  const aWins = a.settingsUpdatedAt > b.settingsUpdatedAt
  const winner = aWins ? a : b
  const loser = aWins ? b : a
  const selected = winner.settings.pairSource.selectedCategoryIds.filter(
    (c) => !c.startsWith(CUSTOM) || lists[c.slice(CUSTOM.length)],
  )
  // Lists only the other copy knew about keep the selection they had there.
  for (const c of loser.settings.pairSource.selectedCategoryIds) {
    const id = c.startsWith(CUSTOM) ? c.slice(CUSTOM.length) : null
    if (id && lists[id] && !winner.lists[id] && !selected.includes(c)) selected.push(c)
  }

  return {
    settings: { ...winner.settings, pairSource: { selectedCategoryIds: selected } },
    settingsUpdatedAt: winner.settingsUpdatedAt,
    lists,
    deleted,
  }
}

/** JSON with sorted keys, so two equal objects always compare equal. */
export function stableJson(v: unknown): string {
  return JSON.stringify(v, (_k, val: unknown) =>
    val && typeof val === 'object' && !Array.isArray(val)
      ? Object.fromEntries(Object.entries(val).sort(([x], [y]) => (x < y ? -1 : x > y ? 1 : 0)))
      : val,
  )
}

/**
 * The database writes (path → value, for update()) that turn `remote` into `next`.
 * Only what changed is written, so two devices saving different lists don't overwrite each other.
 */
export function remoteUpdates(remote: Profile | null, next: Profile): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (!remote || stableJson(remote.settings) !== stableJson(next.settings) || remote.settingsUpdatedAt !== next.settingsUpdatedAt) {
    out.settings = next.settings
    out.settingsUpdatedAt = next.settingsUpdatedAt
  }
  const before = remote?.lists ?? {}
  for (const [id, l] of Object.entries(next.lists)) {
    if (stableJson(before[id]) !== stableJson(l)) out[`lists/${id}`] = l
  }
  for (const id of Object.keys(before)) if (!next.lists[id]) out[`lists/${id}`] = null
  const beforeDel = remote?.deleted ?? {}
  for (const [id, t] of Object.entries(next.deleted)) if (beforeDel[id] !== t) out[`deleted/${id}`] = t
  for (const id of Object.keys(beforeDel)) if (next.deleted[id] === undefined) out[`deleted/${id}`] = null
  return out
}

/** Local list order is kept; lists new to this device go to the end, oldest first. */
export function orderLists(current: CustomList[], lists: Record<string, CustomList>): CustomList[] {
  const kept = current.filter((l) => lists[l.id]).map((l) => lists[l.id])
  const known = new Set(kept.map((l) => l.id))
  const added = Object.values(lists)
    .filter((l) => !known.has(l.id))
    .sort((x, y) => x.createdAt - y.createdAt || x.id.localeCompare(y.id))
  return [...kept, ...added]
}
