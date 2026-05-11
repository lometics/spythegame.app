import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createRoom } from '../online/room'
import { isFirebaseConfigured } from '../online/firebase'

export default function OnlineHost() {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const configured = isFirebaseConfigured()

  const onCreate = async () => {
    if (!name.trim()) {
      setError('Enter your name first.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const code = await createRoom(name)
      navigate(`/room/${code}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create room')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <Link to="/" className="text-sm text-slate-400 hover:text-slate-200">
        ← Home
      </Link>
      <h2 className="font-display text-2xl font-bold">Host an online room</h2>

      {!configured && <ConfigWarning />}

      <div className="card space-y-3">
        <label className="label">Your name</label>
        <input
          className="input"
          value={name}
          maxLength={20}
          placeholder="e.g. Alex"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onCreate()}
        />
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button
          onClick={onCreate}
          disabled={busy || !configured}
          className="btn-primary w-full"
        >
          {busy ? 'Creating…' : 'Create room'}
        </button>
      </div>
    </div>
  )
}

function ConfigWarning() {
  return (
    <div className="card border-amber-500/40 bg-amber-500/5 text-sm space-y-2">
      <div className="font-semibold text-amber-300">
        Firebase isn't configured yet
      </div>
      <p className="text-slate-300">
        Online mode needs a Firebase project. Create one at{' '}
        <a
          className="underline"
          href="https://console.firebase.google.com/"
          target="_blank"
          rel="noreferrer"
        >
          console.firebase.google.com
        </a>{' '}
        and add a Realtime Database. Then copy the web-app config into a{' '}
        <code className="bg-ink-700 px-1 rounded">.env.local</code> file:
      </p>
      <pre className="text-xs bg-ink-900 rounded-lg p-3 overflow-x-auto">
        {`VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...`}
      </pre>
      <p className="text-slate-400">
        Restart <code className="bg-ink-700 px-1 rounded">npm run dev</code>{' '}
        after editing.
      </p>
    </div>
  )
}
