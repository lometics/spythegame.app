import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth,
  signInAnonymously,
  type User,
} from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export function isFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.databaseURL && config.projectId)
}

const app = isFirebaseConfigured()
  ? getApps()[0] ?? initializeApp(config)
  : null

export const auth = app ? getAuth(app) : null
export const db = app ? getDatabase(app) : null

let signInPromise: Promise<User> | null = null

export function ensureSignedIn(): Promise<User> {
  if (!auth) {
    return Promise.reject(new Error('Firebase not configured'))
  }
  if (auth.currentUser) return Promise.resolve(auth.currentUser)
  if (signInPromise) return signInPromise
  const a = auth
  signInPromise = (async () => {
    // Wait for the saved session to be restored first. Signing in before that
    // would create a new anonymous user on every reload, who isn't in the room.
    await a.authStateReady()
    if (a.currentUser) return a.currentUser
    return (await signInAnonymously(a)).user
  })().catch((err) => {
    signInPromise = null
    throw err
  })
  return signInPromise
}
