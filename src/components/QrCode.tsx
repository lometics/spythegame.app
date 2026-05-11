import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function QrCode({
  value,
  size = 192,
  className = '',
}: {
  value: string
  size?: number
  className?: string
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [value, size])

  if (!dataUrl) {
    return (
      <div
        className={`bg-white/5 rounded-xl ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      />
    )
  }

  return (
    <img
      src={dataUrl}
      width={size}
      height={size}
      alt=""
      className={`rounded-xl ${className}`}
    />
  )
}
