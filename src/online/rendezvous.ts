import { useEffect, useState } from 'react'
import {
  ref,
  set,
  get,
  onValue,
  serverTimestamp,
  onDisconnect,
} from 'firebase/database'
import { db, ensureSignedIn } from './firebase'
import { createRoom, joinRoom } from './room'
import i18n from '../i18n'

export type RendezvousState = {
  roomCode: string | null
  loading: boolean
}

export function useMyRendezvous(uid: string | undefined): RendezvousState {
  const [v, setV] = useState<RendezvousState>({ roomCode: null, loading: true })
  useEffect(() => {
    if (!db || !uid) {
      setV({ roomCode: null, loading: false })
      return
    }
    const r = ref(db, `rendezvous/${uid}`)
    const unsub = onValue(r, (snap) => {
      const data = snap.val()
      setV({ roomCode: data?.roomCode ?? null, loading: false })
    })
    return () => unsub()
  }, [uid])
  return v
}

export async function clearRendezvous(uid: string) {
  if (!db) return
  await set(ref(db, `rendezvous/${uid}`), null)
}

export async function armRendezvous(uid: string) {
  if (!db) return
  const r = ref(db, `rendezvous/${uid}`)
  await set(r, { armedAt: serverTimestamp() })
  onDisconnect(r).remove()
}

export async function consumeRendezvous(
  targetUid: string,
  myName: string,
): Promise<string> {
  if (!db) throw new Error(i18n.t('online.errNotConfigured'))
  const me = await ensureSignedIn()
  if (me.uid === targetUid) {
    throw new Error(i18n.t('online.rdvSelfError'))
  }

  const existing = await get(ref(db, `rendezvous/${targetUid}`))
  const existingCode: string | undefined = existing.val()?.roomCode
  if (existingCode) {
    await joinRoom(existingCode, myName)
    await set(ref(db, `rendezvous/${me.uid}`), { roomCode: existingCode })
    return existingCode
  }

  const code = await createRoom(myName)
  await set(ref(db, `rendezvous/${targetUid}`), {
    roomCode: code,
    invitedAt: serverTimestamp(),
  })
  await set(ref(db, `rendezvous/${me.uid}`), { roomCode: code })
  return code
}
