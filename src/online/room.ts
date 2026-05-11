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
import i18n from '../i18n'
import type {
  CustomList,
  Difficulty,
  GamePhase,
  Pair,
  PairSource,
} from '../game/types'

export type OnlinePlayer = {
  name: string
  joinedAt: number
}

export type OnlineMeta = {
  hostUid: string
  createdAt: number
  phase: GamePhase
  round: number
}

export type OnlineRound = {
  pairPublic: { categoryId: string } | null
  firstClueGiverId: string | null
  startedAt: number
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
}

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomCode() {
  let s = ''
  for (let i = 0; i < 4; i++) {
    s += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
  }
  return s
}

export async function createRoom(hostName: string): Promise<string> {
  if (!db) throw new Error(i18n.t('online.errNotConfigured'))
  const user = await ensureSignedIn()
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomCode()
    const existing = await get(ref(db, `rooms/${code}/meta`))
    if (existing.exists()) continue
    await set(ref(db, `rooms/${code}`), {
      meta: {
        hostUid: user.uid,
        createdAt: serverTimestamp(),
        phase: 'lobby',
        round: 0,
      },
      players: {
        [user.uid]: {
          name: hostName.trim() || i18n.t('online.defaultHostName'),
          joinedAt: serverTimestamp(),
        },
      },
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

export function useRoom(code: string | undefined): RoomState {
  const [state, setState] = useState<RoomState>({
    meta: null,
    players: {},
    round: null,
  })
  useEffect(() => {
    if (!db || !code) return
    const metaRef = ref(db, `rooms/${code}/meta`)
    const playersRef = ref(db, `rooms/${code}/players`)
    const roundRef = ref(db, `rooms/${code}/round`)
    const unsubMeta = onValue(metaRef, (s) =>
      setState((prev) => ({ ...prev, meta: s.val() ?? null })),
    )
    const unsubPlayers = onValue(playersRef, (s) =>
      setState((prev) => ({ ...prev, players: s.val() ?? {} })),
    )
    const unsubRound = onValue(roundRef, (s) =>
      setState((prev) => ({ ...prev, round: s.val() ?? null })),
    )
    return () => {
      unsubMeta()
      unsubPlayers()
      unsubRound()
    }
  }, [code])
  return state
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

export function usePairReveal(code: string | undefined): PairReveal | null {
  const [v, setV] = useState<PairReveal | null>(null)
  useEffect(() => {
    if (!db || !code) return
    const r = ref(db, `pairReveals/${code}`)
    const unsub = onValue(
      r,
      (snap) => setV(snap.val() ?? null),
      () => setV(null),
    )
    return () => unsub()
  }, [code])
  return v
}

export async function startOnlineRound(
  code: string,
  pairSource: PairSource,
  customLists: CustomList[],
  players: Record<string, OnlinePlayer>,
  difficulty: Difficulty = 'hard',
  spyCount = 1,
  spiesKnowEachOther = false,
) {
  if (!db) throw new Error(i18n.t('online.errNotConfigured'))
  const pair: Pair = samplePair(pairSource, customLists, difficulty)
  const uids = Object.keys(players)
  if (uids.length < 3) throw new Error(i18n.t('online.errMinPlayers'))
  // Clamp spy count: ≥1, ≤ players-2 so at least 2 civilians remain.
  const n = Math.max(1, Math.min(Math.floor(spyCount), Math.max(1, uids.length - 2)))
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
      firstClueGiverId,
      startedAt: serverTimestamp(),
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

export async function leaveRoom(code: string, uid: string) {
  if (!db) throw new Error(i18n.t('online.errNotConfigured'))
  await set(ref(db, `rooms/${code}/players/${uid}`), null)
  await set(ref(db, `privateWords/${code}/${uid}`), null)
}
