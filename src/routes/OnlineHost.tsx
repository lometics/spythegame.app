import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createRoom } from '../online/room'
import { isFirebaseConfigured } from '../online/firebase'

export default function OnlineHost() {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const configured = isFirebaseConfigured()

  const onCreate = async () => {
    if (!name.trim()) {
      setError(t('online.errEnterName'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      const code = await createRoom(name)
      navigate(`/room/${code}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('online.errCreateRoom'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <Link to="/" className="text-sm text-slate-400 hover:text-slate-200">
        {t('common.home')}
      </Link>
      <h2 className="font-display text-2xl font-bold">{t('online.hostTitle')}</h2>

      {!configured && <ConfigWarning />}

      <div className="card space-y-3">
        <label className="label">{t('online.yourName')}</label>
        <input
          className="input"
          value={name}
          maxLength={20}
          placeholder={t('online.hostNamePlaceholder')}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onCreate()}
        />
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button
          onClick={onCreate}
          disabled={busy || !configured}
          className="btn-primary w-full"
        >
          {busy ? t('online.creating') : t('online.createBtn')}
        </button>
      </div>
    </div>
  )
}

function ConfigWarning() {
  const { t } = useTranslation()
  return (
    <div className="card border-amber-500/40 bg-amber-500/5 text-sm space-y-2">
      <div className="font-semibold text-amber-300">
        {t('online.fbWarnTitle')}
      </div>
      <p className="text-slate-300">
        {t('online.fbWarnBody_before')}
        <a
          className="underline"
          href="https://console.firebase.google.com/"
          target="_blank"
          rel="noreferrer"
        >
          {t('online.fbWarnBody_link')}
        </a>
        {t('online.fbWarnBody_after')}
        <code className="bg-ink-700 px-1 rounded">{t('online.fbWarnBody_envfile')}</code>
        {t('online.fbWarnBody_tail')}
      </p>
      <pre className="text-xs bg-ink-900 rounded-lg p-3 overflow-x-auto">
        {`VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...`}
      </pre>
      <p className="text-slate-400">
        {t('online.fbWarnRestart_before')}
        <code className="bg-ink-700 px-1 rounded">{t('online.fbWarnRestart_cmd')}</code>
        {t('online.fbWarnRestart_after')}
      </p>
    </div>
  )
}
