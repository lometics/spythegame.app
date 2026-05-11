import { useEffect, useRef, useState } from 'react'

type Props = {
  seconds: number
  autoStart?: boolean
}

export default function DiscussionTimer({ seconds, autoStart = true }: Props) {
  const [remaining, setRemaining] = useState(seconds)
  const [running, setRunning] = useState(autoStart)
  const tickRef = useRef<number | null>(null)

  useEffect(() => {
    setRemaining(seconds)
  }, [seconds])

  useEffect(() => {
    if (!running) return
    tickRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current)
    }
  }, [running])

  if (seconds === 0) return null

  const min = Math.floor(remaining / 60)
  const sec = remaining % 60
  const expired = remaining === 0

  return (
    <div className="flex items-center gap-3">
      <div
        className={`font-display text-2xl font-bold tabular-nums ${
          expired ? 'text-rose-400' : 'text-slate-100'
        }`}
      >
        {min}:{sec.toString().padStart(2, '0')}
      </div>
      <button
        className="btn-ghost px-3 py-1.5 text-sm"
        onClick={() => setRunning((r) => !r)}
      >
        {running ? 'Pause' : remaining > 0 ? 'Resume' : 'Done'}
      </button>
      <button
        className="btn-ghost px-3 py-1.5 text-sm"
        onClick={() => {
          setRemaining(seconds)
          setRunning(true)
        }}
      >
        Reset
      </button>
    </div>
  )
}
