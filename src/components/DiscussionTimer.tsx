import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pause, Play, RotateCcw } from 'lucide-react'

/** Countdown for the discussion. Ticks against a deadline so a backgrounded tab stays accurate. */
export default function DiscussionTimer({ seconds }: { seconds: number }) {
  const { t } = useTranslation()
  const [deadline, setDeadline] = useState<number | null>(
    () => Date.now() + seconds * 1000,
  )
  const [pausedAt, setPausedAt] = useState(seconds)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (deadline === null) return
    const id = window.setInterval(() => {
      const t = Date.now()
      if (t >= deadline) {
        navigator.vibrate?.([200, 100, 200])
        setDeadline(null)
        setPausedAt(0)
      }
      setNow(t)
    }, 250)
    return () => window.clearInterval(id)
  }, [deadline])

  const remaining =
    deadline === null
      ? pausedAt
      : Math.max(0, Math.ceil((deadline - now) / 1000))
  const expired = remaining === 0

  const toggle = () => {
    if (deadline === null) {
      if (expired) return
      setDeadline(Date.now() + pausedAt * 1000)
      setNow(Date.now())
    } else {
      setPausedAt(remaining)
      setDeadline(null)
    }
  }
  const reset = () => {
    setPausedAt(seconds)
    setDeadline(Date.now() + seconds * 1000)
    setNow(Date.now())
  }

  const min = Math.floor(remaining / 60)
  const sec = remaining % 60
  const running = deadline !== null

  return (
    <div className="card flex items-center gap-3">
      <div
        className={`flex-1 text-4xl font-bold tabular-nums ${expired ? 'text-spy' : ''}`}
        aria-live="polite"
      >
        {expired ? t('timer.timesUp') : `${min}:${sec.toString().padStart(2, '0')}`}
      </div>
      {!expired && (
        <button
          type="button"
          onClick={toggle}
          className="btn-icon h-12 w-12 bg-surface-2"
          aria-label={running ? t('timer.pause') : t('timer.resume')}
        >
          {running ? <Pause size={22} /> : <Play size={22} />}
        </button>
      )}
      <button
        type="button"
        onClick={reset}
        className="btn-icon h-12 w-12 bg-surface-2"
        aria-label={t('timer.reset')}
      >
        <RotateCcw size={22} />
      </button>
    </div>
  )
}
