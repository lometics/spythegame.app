import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { joinRoom } from '../online/room'
import { isFirebaseConfigured } from '../online/firebase'

export default function OnlineJoin() {
  const { code: codeParam } = useParams()
  const [code, setCode] = useState(codeParam?.toUpperCase() ?? '')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const configured = isFirebaseConfigured()

  const onJoin = async () => {
    if (!code.trim() || !name.trim()) {
      setError('Need both a room code and a name.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await joinRoom(code.trim().toUpperCase(), name)
      navigate(`/room/${code.trim().toUpperCase()}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not join room')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <Link to="/" className="text-sm text-slate-400 hover:text-slate-200">
        ← Home
      </Link>
      <h2 className="font-display text-2xl font-bold">Join a room</h2>

      {!configured && (
        <div className="card border-amber-500/40 bg-amber-500/5 text-sm">
          <div className="font-semibold text-amber-300">
            Firebase isn't configured
          </div>
          <p className="text-slate-300 mt-1">
            Ask whoever set up the site to add the Firebase env vars.
          </p>
        </div>
      )}

      <div className="card space-y-3">
        <div>
          <label className="label">Room code</label>
          <input
            className="input mt-1 font-mono uppercase tracking-widest text-center text-xl"
            value={code}
            maxLength={4}
            placeholder="ABCD"
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </div>
        <div>
          <label className="label">Your name</label>
          <input
            className="input mt-1"
            value={name}
            maxLength={20}
            placeholder="e.g. Sam"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onJoin()}
          />
        </div>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button
          onClick={onJoin}
          disabled={busy || !configured}
          className="btn-primary w-full"
        >
          {busy ? 'Joining…' : 'Join'}
        </button>
      </div>
    </div>
  )
}
