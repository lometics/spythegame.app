import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import QrScanner from 'qr-scanner'
import Sheet from './Sheet'

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
  const [error, setError] = useState<string | null>(null)
  // Kept in a ref so a parent re-render doesn't restart the camera.
  const onResultRef = useRef(onResult)
  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    if (!open) return
    const video = videoRef.current
    if (!video) return
    let cancelled = false
    setError(null)

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
  }, [open, t])

  return (
    <Sheet open={open} onClose={onClose} title={t('online.qrScanTitle')}>
      <p className="pb-3 text-sm muted">{t('online.qrScanHint')}</p>
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
      </div>
      {error && <p className="pt-3 text-sm text-spy">{error}</p>}
    </Sheet>
  )
}
