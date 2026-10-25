import { useEffect, useState } from 'react'
import {
  ref,
  set,
  get,
  update,
  onValue,
  serverTimestamp,
} from 'firebase/database'
import { db, ensureSignedIn } from './firebase'
import { samplePair } from '../game/pairs'
import { resolveSpyCount } from '../game/machine'
import { useGame } from '../game/state'
import i18n from '../i18n'
import type { Difficulty, GamePhase, Pair } from '../game/types'
import {
  normalizeRoomSettings,
  roomSettingsCache,
  seedRoomSettings,
  toRoomData,
  type RoomSettings,
} from './roomSettings'

export type OnlinePlayer = {
  name: string
  joinedAt: number
}

export type OnlineMeta = {
  createdAt: number
  phase: GamePhase
  round: number
}

export type OnlineRound = {
  pairPublic: { categoryId: string } | null
  firstClueGiverId: string | null
  startedAt: number
  /** Discussion timer for this round; 0 = off. Missing on older rounds. */
  timerSeconds?: number
  /** Hint level of this round, so every spy's card explains its hint the same way. */
  hintLevel?: Difficulty
}

export type PairReveal = {
  pair: Pair
  spyUid: string
  spyUids?: string[]
}

export type RoomState = {
  meta: OnlineMeta | null
  players: Record<string, OnlinePlayer>
  round: OnlineRound | null
  /** Null until loaded, and on rooms made before settings were shared. */
  settings: RoomSettings | null
  loaded: boolean
  playersLoaded: boolean
  settingsLoaded: boolean
}

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomCode() {
  let s = ''
  for (let i = 0; i < 4; i++) {
    s += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
  }
  return s
}

export async function createRoom(name: string): Promise<string> {
  if (!db) throw new Error(i18n.t('online.errNotConfigured'))
  const user = await ensureSignedIn()
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomCode()
    const existing = await get(ref(db, `rooms/${code}/meta`))
    if (existing.exists()) continue
    // The room starts with the creator's settings; from then on they're shared.
    const { settings, customLists } = useGame.getState()
    await set(ref(db, `rooms/${code}`), {
      meta: {
        createdAt: serverTimestamp(),
        phase: 'lobby',
        round: 0,
      },
      players: {
        [user.uid]: {
          name: name.trim() || i18n.t('online.defaultGuestName'),
          joinedAt: serverTimestamp(),
        },
      },
      settings: toRoomData(seedRoomSettings(settings, customLists)),
    })
    return code
  }
  throw new Error(i18n.t('online.errCouldNotAllocate'))
}

export async function joinRoom(code: string, name: string) {
  if (!db) throw new Error(i18n.t('online.errNotConfigured'))
  const user = await ensureSignedIn()
  const metaSnap = await get(ref(db, `rooms/${code}/meta`))
  if (!metaSnap.exists()) {
    throw new Error(i18n.t('online.errRoomNotFound'))
  }
  await set(ref(db, `rooms/${code}/players/${user.uid}`), {
    name: name.trim() || i18n.t('online.defaultGuestName'),
    joinedAt: serverTimestamp(),
  })
  return user.uid
}

const EMPTY_ROOM: RoomState = {
  meta: null,
  players: {},
  round: null,
  settings: null,
  loaded: false,
  playersLoaded: false,
  settingsLoaded: false,
}

export function useRoom(code: string | undefined): RoomState {
  // Tagged with the code it belongs to, so switching rooms never shows stale data.
  const [state, setState] = useState<RoomState & { code?: string }>(EMPTY_ROOM)
  useEffect(() => {
    if (!db || !code) return
    const metaRef = ref(db, `rooms/${code}/meta`)
    const playersRef = ref(db, `rooms/${code}/players`)
    const roundRef = ref(db, `rooms/${code}/round`)
    const unsubMeta = onValue(metaRef, (s) =>
      setState((prev) => ({
        ...(prev.code === code ? prev : EMPTY_ROOM),
        code,
        meta: s.val() ?? null,
        loaded: true,
      })),
    )
    const unsubPlayers = onValue(playersRef, (s) =>
      setState((prev) => ({
        ...(prev.code === code ? prev : EMPTY_ROOM),
        code,
        players: s.val() ?? {},
        playersLoaded: true,
      })),
    )
    const unsubRound = onValue(roundRef, (s) =>
      setState((prev) => ({
        ...(prev.code === code ? prev : EMPTY_ROOM),
        code,
        round: s.val() ?? null,
      })),
    )
    const unsubSettings = subscribeRoomSettings(code, (settings) =>
      setState((prev) => ({
        ...(prev.code === code ? prev : EMPTY_ROOM),
        code,
        settings,
        settingsLoaded: true,
      })),
    )
    return () => {
      unsubMeta()
      unsubPlayers()
      unsubRound()
      unsubSettings()
    }
  }, [code])
  return state.code === code ? state : EMPTY_ROOM
}

/** Live room settings; also kept in the cache so setup pages open with them. */
export function subscribeRoomSettings(
  code: string,
  cb: (settings: RoomSettings | null) => void,
): () => void {
  if (!db) return () => {}
  return onValue(
    ref(db, `rooms/${code}/settings`),
    (s) => {
      const settings = normalizeRoomSettings(s.val())
      if (settings) roomSettingsCache.set(code, settings)
      else roomSettingsCache.delete(code)
      cb(settings)
    },
    () => cb(null),
  )
}

/** Anyone in the room may change its settings; the last change wins. */
export async function saveRoomSettings(code: string, settings: RoomSettings) {
  if (!db) throw new Error(i18n.t('online.errNotConfigured'))
  await set(ref(db, `rooms/${code}/settings`), toRoomData(settings))
}

export function useMyPrivate(
  code: string | undefined,
  uid: string | undefined,
): {
  word: string | null
  isSpy: boolean
  fellowSpyNames: string[] | null
} {
  const [v, setV] = useState<{
    word: string | null
    isSpy: boolean
    fellowSpyNames: string[] | null
  }>({
    word: null,
    isSpy: false,
    fellowSpyNames: null,
  })
  useEffect(() => {
    if (!db || !code || !uid) return
    const r = ref(db, `privateWords/${code}/${uid}`)
    const unsub = onValue(r, (snap) => {
      const data = snap.val()
      const rawFellow = data?.fellowSpyNames
      setV({
        word: data?.word ?? null,
        isSpy: Boolean(data?.isSpy),
        fellowSpyNames: Array.isArray(rawFellow) ? (rawFellow as string[]) : null,
      })
    })
    return () => unsub()
  }, [code, uid])
  return v
}

export function usePairReveal(
  code: string | undefined,
  enabled = true,
): PairReveal | null {
  const [v, setV] = useState<PairReveal | null>(null)
  useEffect(() => {
    if (!db || !code || !enabled) return
    const r = ref(db, `pairReveals/${code}`)
    const unsub = onValue(
      r,
      (snap) => setV(snap.val() ?? null),
      () => setV(null),
    )
    return () => unsub()
  }, [code, enabled])
  // Hidden outside the result phase so an old round's answer never flashes up.
  return enabled ? v : null
}

/** Deals a round from the room's shared settings, whoever presses start. */
export async function startOnlineRound(
  code: string,
  { settings, lists }: RoomSettings,
  players: Record<string, OnlinePlayer>,
) {
  if (!db) throw new Error(i18n.t('online.errNotConfigured'))
  const { difficulty, spyCount, spiesKnowEachOther, timerSeconds } = settings
  const pair: Pair = samplePair(settings.pairSource, lists, difficulty)
  const uids = Object.keys(players)
  if (uids.length < 3) throw new Error(i18n.t('online.errMinPlayers'))
  const n = resolveSpyCount(spyCount, uids.length)
  const shuffled = [...uids]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const spyUids = shuffled.slice(0, n)
  const spySet = new Set(spyUids)
  const firstClueGiverId = uids[Math.floor(Math.random() * uids.length)]

  const privateUpdates: Record<
    string,
    { word: string; isSpy: boolean; fellowSpyNames?: string[] }
  > = {}
  for (const uid of uids) {
    const isSpy = spySet.has(uid)
    const entry: { word: string; isSpy: boolean; fellowSpyNames?: string[] } = {
      word: isSpy ? pair.spy : pair.civilian,
      isSpy,
    }
    if (isSpy && spiesKnowEachOther) {
      entry.fellowSpyNames = spyUids
        .filter((u) => u !== uid)
        .map((u) => players[u]?.name ?? '')
        .filter((name) => name.length > 0)
    }
    privateUpdates[uid] = entry
  }

  const currentRoundSnap = await get(ref(db, `rooms/${code}/meta/round`))
  const nextRound = (currentRoundSnap.val() ?? 0) + 1

  const updates: Record<string, unknown> = {
    [`rooms/${code}/meta/phase`]: 'reveal',
    [`rooms/${code}/meta/round`]: nextRound,
    [`rooms/${code}/round`]: {
      pairPublic: { categoryId: pair.categoryId },
      hintLevel: difficulty,
      firstClueGiverId,
      startedAt: serverTimestamp(),
      timerSeconds,
    },
    [`privateWords/${code}`]: privateUpdates,
    [`pairReveals/${code}`]: { pair, spyUid: spyUids[0], spyUids },
  }
  await update(ref(db), updates)
}

export async function setPhase(code: string, phase: GamePhase) {
  if (!db) throw new Error(i18n.t('online.errNotConfigured'))
  await update(ref(db, `rooms/${code}/meta`), { phase })
}

export async function revealOnline(code: string) {
  if (!db) throw new Error(i18n.t('online.errNotConfigured'))
  await update(ref(db, `rooms/${code}/meta`), { phase: 'result' })
}

export async function backToLobby(code: string) {
  if (!db) throw new Error(i18n.t('online.errNotConfigured'))
  await update(ref(db), {
    [`rooms/${code}/meta/phase`]: 'lobby',
    [`rooms/${code}/round`]: null,
    [`privateWords/${code}`]: null,
    [`pairReveals/${code}`]: null,
  })
}

export async function renamePlayerInRoom(
  code: string,
  uid: string,
  name: string,
) {
  if (!db) throw new Error(i18n.t('online.errNotConfigured'))
  const trimmed = name.trim()
  if (!trimmed) return
  await update(ref(db, `rooms/${code}/players/${uid}`), { name: trimmed })
}

export async function leaveRoom(code: string, uid: string) {
  if (!db) throw new Error(i18n.t('online.errNotConfigured'))
  await set(ref(db, `rooms/${code}/players/${uid}`), null)
  await set(ref(db, `privateWords/${code}/${uid}`), null).catch(() => {})
}

export async function kickPlayer(code: string, uid: string) {
  if (!db) throw new Error(i18n.t('online.errNotConfigured'))
  await set(ref(db, `rooms/${code}/players/${uid}`), null)
}
