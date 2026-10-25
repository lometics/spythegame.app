import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ScanLine } from 'lucide-react'
import Screen from '../components/Screen'
import QrScanPanel from '../components/QrScanPanel'
import { useGame } from '../game/state'
import { createRoom, joinRoom } from '../online/room'
import { isFirebaseConfigured } from '../online/firebase'
import { extractRoomCode } from '../online/roster'

/** Entry for "everyone on their own device": name, then create or join. */
export default function Online() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const onlineName = useGame((s) => s.onlineName)
  const setOnlineName = useGame((s) => s.setOnlineName)
  const joinCode = useGame((s) => s.joinCode)
  const setJoinCode = useGame((s) => s.setJoinCode)
  const [busy, setBusy] = useState<'create' | 'join' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)

  const configured = isFirebaseConfigured()
  const name = onlineName.trim()
  const code = joinCode.trim().toUpperCase()

  const create = async () => {
    setBusy('create')
    setError(null)
    try {
      navigate(`/room/${await createRoom(name)}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(null)
    }
  }

  const join = async (target: string) => {
    setBusy('join')
    setError(null)
    try {
      await joinRoom(target, name)
      navigate(`/room/${target}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(null)
    }
  }

  // A scanned code joins right away when we already have a name.
  const onScan = (text: string) => {
    setScannerOpen(false)
    const scanned = extractRoomCode(text)
    if (!scanned) {
      setError(t('online.qrInvalid'))
      return
    }
    setJoinCode(scanned)
    setError(null)
    if (name) join(scanned)
  }

  return (
    <Screen title={t('home.ownDevice')} back="/">
      {!configured && (
        <p className="card text-sm text-spy">{t('online.fbNotConfigured')}</p>
      )}

      <section>
        <label className="section-label block" htmlFor="online-name">
          {t('online.yourName')}
        </label>
        <input
          id="online-name"
          className="input"
          value={onlineName}
          maxLength={20}
          autoFocus={!onlineName}
          autoCapitalize="words"
          onChange={(e) => setOnlineName(e.target.value)}
        />
      </section>

      <button
        type="button"
        className="btn-primary w-full"
        disabled={!configured || !name || busy !== null}
        onClick={create}
      >
        {busy === 'create' ? t('online.creating') : t('online.createRoom')}
      </button>

      <div className="flex items-center gap-3 text-sm muted">
        <span className="h-px flex-1 bg-foreground/15" />
        {t('online.or')}
        <span className="h-px flex-1 bg-foreground/15" />
      </div>

      <section className="space-y-3">
        {scannerOpen ? (
          <QrScanPanel onResult={onScan} onCancel={() => setScannerOpen(false)} />
        ) : (
          <>
            <div className="flex gap-2">
              <input
                className="input flex-1 text-center font-mono text-2xl uppercase tracking-[0.4em]"
                value={joinCode}
                maxLength={4}
                placeholder="ABCD"
                aria-label={t('online.roomCode')}
                autoCapitalize="characters"
                autoComplete="off"
                enterKeyHint="go"
                onChange={(e) => setJoinCode(e.target.value.replace(/[^a-z0-9]/gi, ''))}
                onKeyDown={(e) => e.key === 'Enter' && name && code.length === 4 && join(code)}
              />
              <button
                type="button"
                className="btn-secondary w-[3.25rem] px-0"
                onClick={() => setScannerOpen(true)}
                disabled={!configured}
                aria-label={t('online.scanQr')}
              >
                <ScanLine size={22} />
              </button>
            </div>
            <button
              type="button"
              className="btn-secondary w-full"
              disabled={!configured || !name || code.length !== 4 || busy !== null}
              onClick={() => join(code)}
            >
              {busy === 'join' ? t('online.joining') : t('online.join')}
            </button>
          </>
        )}
      </section>

      {error && <p className="text-center text-sm text-spy">{error}</p>}
    </Screen>
  )
}
