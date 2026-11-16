// Optional Google sign-in. Signed in, the game settings and own word lists are
// kept at users/<uid> in the Realtime Database and synced on every device the
// account is used on. Signed out, everything stays on the device as before.
import {
  GoogleAuthProvider,
  linkWithPopup,
  signInWithCredential,
  signInWithPopup,
  deleteUser,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { onValue, ref, remove, update } from 'firebase/database'
import { FirebaseError } from 'firebase/app'
import { auth, db } from '../online/firebase'
import { useGame } from '../game/state'
import type { Account } from '../game/types'
import {
  mergeProfiles,
  normalizeProfile,
  orderLists,
  profileFromState,
  remoteUpdates,
  stableJson,
  type Profile,
} from './profile'
import { setSyncState } from './status'

function toAccount(user: User): Account {
  const google = user.providerData.find((p) => p.providerId === 'google.com')
  return {
    uid: user.uid,
    name: google?.displayName ?? user.displayName ?? '',
    email: google?.email ?? user.email ?? '',
  }
}

/**
 * Opens Google's sign-in popup. A device that already played online has an
 * anonymous user; it's upgraded in place so it stays in its room. If that
 * Google account is already in use, we switch to it instead.
 */
export async function signInWithGoogle(): Promise<Account> {
  if (!auth) throw new Error('Firebase not configured')
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  await auth.authStateReady()
  const current = auth.currentUser
  let user: User
  if (current?.isAnonymous) {
    try {
      user = (await linkWithPopup(current, provider)).user
    } catch (e) {
      const cred =
        e instanceof FirebaseError && e.code === 'auth/credential-already-in-use'
          ? GoogleAuthProvider.credentialFromError(e)
          : null
      if (!cred) throw e
      user = (await signInWithCredential(auth, cred)).user
    }
  } else {
    user = (await signInWithPopup(auth, provider)).user
  }
  const account = toAccount(user)
  useGame.getState().setAccount(account)
  startSync(account.uid)
  return account
}

/**
 * Deletes what the account has saved (and the sign-in itself, when Firebase
 * allows it without signing in again). Settings and lists stay on this device.
 */
export async function deleteAccountData(): Promise<void> {
  const user = auth?.currentUser
  if (!db || !user || user.isAnonymous) return
  stopSync()
  await remove(ref(db, `users/${user.uid}`))
  useGame.getState().setAccount(null)
  // Needs a recent sign-in; if it's too long ago, signing out is enough.
  await deleteUser(user).catch(() => auth && fbSignOut(auth))
}

/** Signs out; settings and lists stay on this device, they're just no longer synced. */
export async function signOut(): Promise<void> {
  stopSync()
  useGame.getState().setAccount(null)
  if (auth) await fbSignOut(auth)
}

/** On app start: picks up syncing again if this device is signed in. */
export async function resumeSync(): Promise<void> {
  const saved = useGame.getState().account
  if (!saved || !auth) return
  await auth.authStateReady()
  const user = auth.currentUser
  if (user && !user.isAnonymous && user.uid === saved.uid) {
    useGame.getState().setAccount(toAccount(user))
    startSync(user.uid)
  } else {
    // Session ended elsewhere (signed out, account removed): back to device-only.
    useGame.getState().setAccount(null)
  }
}

let stopCurrent: (() => void) | null = null

function stopSync() {
  stopCurrent?.()
  stopCurrent = null
  setSyncState('off')
}

const SAVE_DELAY_MS = 800

function syncedPart(s: ReturnType<typeof useGame.getState>) {
  return [s.settings, s.settingsUpdatedAt, s.customLists, s.deletedLists]
}

function startSync(uid: string) {
  stopSync()
  if (!db) return
  const node = ref(db, `users/${uid}`)
  let remote: Profile | null = null
  let loaded = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let online = true
  let pending = 0
  setSyncState('connecting')

  const settle = () => {
    if (!loaded) return
    setSyncState(!online ? 'offline' : pending > 0 ? 'saving' : 'synced')
  }

  const reconcile = () => {
    const state = useGame.getState()
    const local = profileFromState(state)
    const merged = mergeProfiles(local, remote)
    if (stableJson(merged) !== stableJson(local)) {
      state.applySynced({
        settings: merged.settings,
        settingsUpdatedAt: merged.settingsUpdatedAt,
        customLists: orderLists(state.customLists, merged.lists),
        deletedLists: merged.deleted,
      })
    }
    const writes = remoteUpdates(remote, merged)
    if (Object.keys(writes).length > 0) {
      // Offline writes are queued by the SDK and sent when the connection is back.
      pending++
      settle()
      update(node, writes)
        .then(() => {
          pending--
          settle()
        })
        .catch((err) => {
          pending--
          console.warn('account sync failed', err)
          setSyncState('error')
        })
    } else {
      settle()
    }
  }

  const offValue = onValue(
    node,
    (snap) => {
      remote = normalizeProfile(snap.val())
      loaded = true
      clearTimeout(timer)
      reconcile()
    },
    (err) => {
      console.warn('account sync stopped', err)
      setSyncState('error')
    },
  )
  const offConnected = onValue(ref(db, '.info/connected'), (snap) => {
    online = snap.val() === true
    settle()
  })
  const offStore = useGame.subscribe((s, prev) => {
    if (!loaded) return
    const now = syncedPart(s)
    const before = syncedPart(prev)
    if (now.every((v, i) => v === before[i])) return
    clearTimeout(timer)
    setSyncState(online ? 'saving' : 'offline')
    timer = setTimeout(reconcile, SAVE_DELAY_MS)
  })
  stopCurrent = () => {
    clearTimeout(timer)
    offValue()
    offConnected()
    offStore()
  }
}
