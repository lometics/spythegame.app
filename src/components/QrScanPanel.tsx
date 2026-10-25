import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import QrScanner from 'qr-scanner'

/** Camera view shown in place of the code field while scanning a room QR code. */
export default function QrScanPanel({
  onResult,
  onCancel,
}: {
  onResult: (text: string) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Kept in a ref so a parent re-render doesn't restart the camera.
  const onResultRef = useRef(onResult)
  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let cancelled = false

    const scanner = new QrScanner(
      video,
      (result) => {
        if (!cancelled) onResultRef.current(result.data)
      },
      {
        returnDetailedScanResult: true,
        preferredCamera: 'environment',
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 8,
      },
    )
    scanner.start().catch(() => {
      if (!cancelled) setError(t('online.qrCameraError'))
    })

    return () => {
      cancelled = true
      scanner.stop()
      scanner.destroy()
    }
  }, [t])

  return (
    <div className="animate-in space-y-3">
      <p className="text-sm muted">{t('online.qrScanHint')}</p>
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
      </div>
      {error && <p className="text-sm text-spy">{error}</p>}
      <button type="button" className="btn-secondary w-full" onClick={onCancel}>
        {t('common.cancel')}
      </button>
    </div>
  )
}
