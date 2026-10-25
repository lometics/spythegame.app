import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ScanLine } from 'lucide-react'
import Screen from '../components/Screen'
import QrScanPanel from '../components/QrScanPanel'
import { useGame } from '../game/state'
import { createRoom } from '../online/room'
import { isFirebaseConfigured } from '../online/firebase'
import { extractRoomCode } from '../online/roster'

/**
 * Entry for "everyone on their own device": create a room or enter a code.
 * The name is asked afterwards, in the room (see OnlineRoom's NameStep).
 */
export default function Online() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const onlineName = useGame((s) => s.onlineName)
  const joinCode = useGame((s) => s.joinCode)
  const setJoinCode = useGame((s) => s.setJoinCode)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)

  const configured = isFirebaseConfigured()
  const code = joinCode.trim().toUpperCase()

  const create = async () => {
    setBusy(true)
    setError(null)
    try {
      const room = await createRoom(onlineName)
      navigate(`/room/${room}`, { state: { askName: true } })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  // The room page asks for the name, then joins.
  const join = (target: string) => navigate(`/room/${target}`)

  const onScan = (text: string) => {
    setScannerOpen(false)
    const scanned = extractRoomCode(text)
    if (!scanned) {
      setError(t('online.qrInvalid'))
      return
    }
    setJoinCode(scanned)
    join(scanned)
  }

  return (
    <Screen title={t('home.ownDevice')} back="/">
      {!configured && (
        <p className="card text-sm text-spy">{t('online.fbNotConfigured')}</p>
      )}

      <button
        type="button"
        className="btn-primary w-full"
        disabled={!configured || busy}
        onClick={create}
      >
        {busy ? t('online.creating') : t('online.createRoom')}
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
                onKeyDown={(e) => e.key === 'Enter' && code.length === 4 && join(code)}
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
              disabled={!configured || code.length !== 4}
              onClick={() => join(code)}
            >
              {t('online.join')}
            </button>
          </>
        )}
      </section>

      {error && <p className="text-center text-sm text-spy">{error}</p>}
    </Screen>
  )
}
