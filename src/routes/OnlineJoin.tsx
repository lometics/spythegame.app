import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { joinRoom } from '../online/room'
import { isFirebaseConfigured } from '../online/firebase'
import QrScannerModal from '../components/QrScannerModal'

function extractCode(scanned: string): string | null {
  const trimmed = scanned.trim()
  const match = trimmed.match(/\/join\/([A-Za-z0-9]{4})/)
  if (match) return match[1].toUpperCase()
  if (/^[A-Za-z0-9]{4}$/.test(trimmed)) return trimmed.toUpperCase()
  return null
}

export default function OnlineJoin() {
  const { t } = useTranslation()
  const { code: codeParam } = useParams()
  const [code, setCode] = useState(codeParam?.toUpperCase() ?? '')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const navigate = useNavigate()
  const configured = isFirebaseConfigured()

  const onJoin = async () => {
    if (!code.trim() || !name.trim()) {
      setError(t('online.errNeedBoth'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      await joinRoom(code.trim().toUpperCase(), name)
      navigate(`/room/${code.trim().toUpperCase()}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('online.errCouldNotJoin'))
    } finally {
      setBusy(false)
    }
  }

  const onScan = (text: string) => {
    const parsed = extractCode(text)
    if (!parsed) {
      setError(t('online.qrInvalid'))
      setScannerOpen(false)
      return
    }
    setCode(parsed)
    setError(null)
    setScannerOpen(false)
  }

  return (
    <div className="space-y-5">
      <Link to="/" className="text-sm text-slate-400 hover:text-slate-200">
        {t('common.home')}
      </Link>
      <h2 className="font-display text-2xl font-bold">{t('online.joinTitle')}</h2>

      {!configured && (
        <div className="card border-amber-500/40 bg-amber-500/5 text-sm">
          <div className="font-semibold text-amber-300">
            {t('online.fbWarnTitleShort')}
          </div>
          <p className="text-slate-300 mt-1">{t('online.fbWarnJoin')}</p>
        </div>
      )}

      <div className="card space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <label className="label">{t('online.roomCode')}</label>
            <button
              type="button"
              className="btn-ghost px-2 py-1 text-xs"
              onClick={() => setScannerOpen(true)}
              disabled={!configured}
            >
              {t('online.scanQr')}
            </button>
          </div>
          <input
            className="input mt-1 font-mono uppercase tracking-widest text-center text-xl"
            value={code}
            maxLength={4}
            placeholder={t('online.codePlaceholder')}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </div>
        <div>
          <label className="label">{t('online.yourName')}</label>
          <input
            className="input mt-1"
            value={name}
            maxLength={20}
            placeholder={t('online.joinNamePlaceholder')}
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
          {busy ? t('online.joining') : t('online.joinBtn')}
        </button>
      </div>

      <QrScannerModal
        open={scannerOpen}
        onResult={onScan}
        onClose={() => setScannerOpen(false)}
      />
    </div>
  )
}
