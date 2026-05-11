import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
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
  signInPromise = new Promise<User>((resolve, reject) => {
    const unsub = onAuthStateChanged(auth!, (u) => {
      if (u) {
        unsub()
        resolve(u)
      }
    })
    signInAnonymously(auth!).catch((err) => {
      unsub()
      reject(err)
    })
  })
  return signInPromise
}
