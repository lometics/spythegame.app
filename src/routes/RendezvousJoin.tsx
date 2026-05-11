import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isFirebaseConfigured } from '../online/firebase'
import { consumeRendezvous } from '../online/rendezvous'
import { getStoredName } from '../online/playerName'

export default function RendezvousJoin() {
  const { t } = useTranslation()
  const { uid } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isFirebaseConfigured() || !uid) return
    let cancelled = false
    const myName = getStoredName() || t('online.defaultGuestName')
    consumeRendezvous(uid, myName)
      .then((code) => {
        if (cancelled) return
        navigate(`/room/${code}`, { replace: true })
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : t('online.errCouldNotJoin'))
      })
    return () => {
      cancelled = true
    }
  }, [uid, navigate, t])

  if (!isFirebaseConfigured()) {
    return (
      <div className="space-y-4">
        <Link to="/" className="text-sm text-slate-400">
          {t('common.home')}
        </Link>
        <div className="card text-sm">{t('online.fbNotConfigured')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Link to="/" className="text-sm text-slate-400">
        {t('common.home')}
      </Link>
      {error ? (
        <div className="card border-rose-500/40 bg-rose-500/5 text-sm">
          <div className="font-semibold text-rose-300">
            {t('online.rdvFailTitle')}
          </div>
          <p className="text-slate-300 mt-1">{error}</p>
        </div>
      ) : (
        <div className="card text-center text-slate-300 py-8">
          <div className="text-3xl mb-2">🤝</div>
          <div className="font-display text-lg font-bold">
            {t('online.rdvConnecting')}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {t('online.rdvConnectingHint')}
          </p>
        </div>
      )}
    </div>
  )
}
