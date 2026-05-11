import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import InstallPrompt from '../components/InstallPrompt'
import QrCode from '../components/QrCode'
import QrScannerModal from '../components/QrScannerModal'
import { ensureSignedIn, isFirebaseConfigured } from '../online/firebase'
import {
  armRendezvous,
  clearRendezvous,
  useMyRendezvous,
} from '../online/rendezvous'
import { joinRoom } from '../online/room'
import { getStoredName, setStoredName } from '../online/playerName'

function extractRdvUid(scanned: string): string | null {
  const trimmed = scanned.trim()
  const match = trimmed.match(/\/rdv\/([A-Za-z0-9_-]+)/)
  if (match) return match[1]
  return null
}

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const configured = isFirebaseConfigured()
  const [uid, setUid] = useState<string | null>(null)
  const [name, setName] = useState(() => getStoredName())
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const joinedRef = useRef<string | null>(null)

  const { roomCode } = useMyRendezvous(uid ?? undefined)

  useEffect(() => {
    if (!configured) return
    let cancelled = false
    ensureSignedIn()
      .then((u) => {
        if (cancelled) return
        setUid(u.uid)
        armRendezvous(u.uid).catch(() => {})
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [configured])

  useEffect(() => {
    if (!uid || !roomCode) return
    if (joinedRef.current === roomCode) return
    joinedRef.current = roomCode
    const myName = name.trim() || t('online.defaultGuestName')
    setStoredName(myName)
    joinRoom(roomCode, myName)
      .then(() => clearRendezvous(uid).catch(() => {}))
      .catch(() => {})
      .finally(() => {
        navigate(`/room/${roomCode}`, { replace: true })
      })
  }, [uid, roomCode, name, navigate, t])

  const onNameChange = (v: string) => {
    setName(v)
    setStoredName(v)
  }

  const onScan = (text: string) => {
    const target = extractRdvUid(text)
    if (!target) {
      setScanError(t('online.qrInvalid'))
      setScannerOpen(false)
      return
    }
    setScannerOpen(false)
    setScanError(null)
    navigate(`/rdv/${target}`)
  }

  const inviteUrl =
    uid != null
      ? `${window.location.origin}${window.location.pathname}#/rdv/${uid}`
      : ''

  return (
    <div className="space-y-3 sm:space-y-6">
      <header className="text-center pt-2 sm:pt-12">
        <div className="inline-block text-3xl sm:text-5xl mb-1 sm:mb-3">🕵️</div>
        <h1 className="font-display text-2xl sm:text-5xl font-extrabold tracking-tight">
          {t('home.title')}
        </h1>
        <p className="text-slate-400 text-xs sm:text-base mt-1 sm:mt-2 max-w-md mx-auto">
          {t('home.subtitle_before')}
          <span className="text-accent-400 font-semibold">
            {t('home.subtitle_highlight')}
          </span>
          {t('home.subtitle_after')}
        </p>
      </header>

      {configured && (
        <section className="card space-y-2 sm:space-y-3">
          <div className="text-center">
            <div className="text-base sm:text-lg font-semibold">
              {t('home.rdv.title')}
            </div>
            <div className="text-xs sm:text-sm text-slate-400">
              {t('home.rdv.desc')}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 sm:gap-3">
            {uid ? (
              <QrCode value={inviteUrl} size={140} />
            ) : (
              <div
                className="bg-white/5 rounded-xl"
                style={{ width: 140, height: 140 }}
                aria-hidden
              />
            )}
            <input
              className="input text-center"
              value={name}
              maxLength={20}
              placeholder={t('home.rdv.namePlaceholder')}
              onChange={(e) => onNameChange(e.target.value)}
            />
            <button
              className="btn-ghost w-full"
              onClick={() => {
                setScanError(null)
                setScannerOpen(true)
              }}
            >
              {t('home.rdv.scanBtn')}
            </button>
            {scanError && (
              <p className="text-xs text-rose-400">{scanError}</p>
            )}
          </div>
        </section>
      )}

      <section className="grid gap-2 sm:gap-3">
        <Link to="/local" className="card hover:bg-ink-700/60 transition block">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base sm:text-lg font-semibold">
                {t('home.passAndPlay.title')}
              </div>
              <div className="text-xs sm:text-sm text-slate-400">
                {t('home.passAndPlay.desc')}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl">📱</div>
          </div>
        </Link>

        <Link
          to="/online"
          className="card hover:bg-ink-700/60 transition block"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base sm:text-lg font-semibold">{t('home.host.title')}</div>
              <div className="text-xs sm:text-sm text-slate-400">{t('home.host.desc')}</div>
            </div>
            <div className="text-2xl sm:text-3xl">🌐</div>
          </div>
        </Link>

        <Link to="/join" className="card hover:bg-ink-700/60 transition block">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base sm:text-lg font-semibold">{t('home.join.title')}</div>
              <div className="text-xs sm:text-sm text-slate-400">{t('home.join.desc')}</div>
            </div>
            <div className="text-2xl sm:text-3xl">🔑</div>
          </div>
        </Link>
      </section>

      <InstallPrompt />

      <details className="card text-sm text-slate-300">
        <summary className="cursor-pointer font-semibold text-slate-200">
          {t('home.howTo.title')}
        </summary>
        <ol className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2 list-decimal pl-5 text-xs sm:text-sm">
          <li>
            {t('home.howTo.step1_before')}
            <em>{t('home.howTo.step1_spy')}</em>
            {t('home.howTo.step1_mid')}
            <em>{t('home.howTo.step1_similar')}</em>
            {t('home.howTo.step1_after')}
          </li>
          <li>{t('home.howTo.step2')}</li>
          <li>{t('home.howTo.step3')}</li>
        </ol>
      </details>

      <QrScannerModal
        open={scannerOpen}
        onResult={onScan}
        onClose={() => setScannerOpen(false)}
      />
    </div>
  )
}
