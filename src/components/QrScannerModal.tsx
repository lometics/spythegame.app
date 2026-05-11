import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import QrScanner from 'qr-scanner'

export default function QrScannerModal({
  open,
  onResult,
  onClose,
}: {
  open: boolean
  onResult: (text: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const video = videoRef.current
    if (!video) return

    setError(null)

    const scanner = new QrScanner(
      video,
      (result) => {
        if (cancelled) return
        onResult(result.data)
      },
      {
        returnDetailedScanResult: true,
        preferredCamera: 'environment',
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 8,
      },
    )
    scannerRef.current = scanner

    scanner.start().catch((e) => {
      if (cancelled) return
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg || t('online.qrCameraError'))
    })

    return () => {
      cancelled = true
      scanner.stop()
      scanner.destroy()
      scannerRef.current = null
    }
  }, [open, onResult, t])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="card max-w-sm w-full space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">
            {t('online.qrScanTitle')}
          </h3>
          <button
            className="btn-ghost px-2 py-1 text-sm"
            onClick={onClose}
            aria-label={t('common.cancel')}
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-slate-400">{t('online.qrScanHint')}</p>
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
          />
        </div>
        {error && (
          <p className="text-sm text-rose-400 break-words">
            {t('online.qrCameraError')}: {error}
          </p>
        )}
        <button className="btn-ghost w-full" onClick={onClose}>
          {t('common.cancel')}
        </button>
      </div>
    </div>
  )
}
