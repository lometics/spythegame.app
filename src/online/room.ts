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
import type {
  CustomList,
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
  if (!db) throw new Error('Firebase not configured')
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
          name: hostName.trim() || 'Host',
          joinedAt: serverTimestamp(),
        },
      },
    })
    return code
  }
  throw new Error('Could not allocate a room code, try again')
}

export async function joinRoom(code: string, name: string) {
  if (!db) throw new Error('Firebase not configured')
  const user = await ensureSignedIn()
  const metaSnap = await get(ref(db, `rooms/${code}/meta`))
  if (!metaSnap.exists()) {
    throw new Error('Room not found')
  }
  await set(ref(db, `rooms/${code}/players/${user.uid}`), {
    name: name.trim() || 'Guest',
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
): { word: string | null; isSpy: boolean } {
  const [v, setV] = useState<{ word: string | null; isSpy: boolean }>({
    word: null,
    isSpy: false,
  })
  useEffect(() => {
    if (!db || !code || !uid) return
    const r = ref(db, `privateWords/${code}/${uid}`)
    const unsub = onValue(r, (snap) => {
      const data = snap.val()
      setV({
        word: data?.word ?? null,
        isSpy: Boolean(data?.isSpy),
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
) {
  if (!db) throw new Error('Firebase not configured')
  const pair: Pair = samplePair(pairSource, customLists)
  const uids = Object.keys(players)
  if (uids.length < 3) throw new Error('Need at least 3 players')
  const spyUid = uids[Math.floor(Math.random() * uids.length)]
  const firstClueGiverId = uids[Math.floor(Math.random() * uids.length)]

  const privateUpdates: Record<string, { word: string; isSpy: boolean }> = {}
  for (const uid of uids) {
    privateUpdates[uid] = {
      word: uid === spyUid ? pair.spy : pair.civilian,
      isSpy: uid === spyUid,
    }
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
    [`pairReveals/${code}`]: { pair, spyUid },
  }
  await update(ref(db), updates)
}

export async function setPhase(code: string, phase: GamePhase) {
  if (!db) throw new Error('Firebase not configured')
  await update(ref(db, `rooms/${code}/meta`), { phase })
}

export async function revealOnline(code: string) {
  if (!db) throw new Error('Firebase not configured')
  await update(ref(db, `rooms/${code}/meta`), { phase: 'result' })
}

export async function backToLobby(code: string) {
  if (!db) throw new Error('Firebase not configured')
  await update(ref(db), {
    [`rooms/${code}/meta/phase`]: 'lobby',
    [`rooms/${code}/round`]: null,
    [`privateWords/${code}`]: null,
    [`pairReveals/${code}`]: null,
  })
}

export async function leaveRoom(code: string, uid: string) {
  if (!db) throw new Error('Firebase not configured')
  await set(ref(db, `rooms/${code}/players/${uid}`), null)
  await set(ref(db, `privateWords/${code}/${uid}`), null)
}
