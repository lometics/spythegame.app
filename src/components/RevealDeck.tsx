import { useRef, useState } from 'react'
import PlayerCard from './PlayerCard'
import type { Pair, Player } from '../game/types'

type Props = {
  players: Player[]
  pair: Pair
  onFinish: () => void
}

const SWIPE_THRESHOLD = 60 // px horizontal delta to count as a swipe

export default function RevealDeck({ players, pair, onFinish }: Props) {
  const [index, setIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [animating, setAnimating] = useState<'left' | 'right' | null>(null)
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)

  const current = players[index]
  const isLast = index >= players.length - 1
  const isFirst = index === 0

  const goNext = () => {
    if (isLast) {
      onFinish()
      return
    }
    setAnimating('left')
    window.setTimeout(() => {
      setIndex((i) => Math.min(i + 1, players.length - 1))
      setDragX(0)
      setAnimating(null)
    }, 280)
  }

  const goPrev = () => {
    if (isFirst) {
      setDragX(0)
      return
    }
    setAnimating('right')
    window.setTimeout(() => {
      setIndex((i) => Math.max(i - 1, 0))
      setDragX(0)
      setAnimating(null)
    }, 280)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (animating) return
    startX.current = e.clientX
    startY.current = e.clientY
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current === null || startY.current === null) return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current
    // If the user is scrolling vertically, abort drag.
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) {
      startX.current = null
      startY.current = null
      setDragX(0)
      return
    }
    setDragX(dx)
  }
  const onPointerUp = () => {
    const dx = dragX
    startX.current = null
    startY.current = null
    if (dx < -SWIPE_THRESHOLD) goNext()
    else if (dx > SWIPE_THRESHOLD) goPrev()
    else setDragX(0)
  }

  // Build the visible transform for the current card
  let translatePx = dragX
  if (animating === 'left') translatePx = -window.innerWidth
  if (animating === 'right') translatePx = window.innerWidth
  const transition = animating
    ? 'transform 0.28s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.28s'
    : startX.current !== null
      ? 'none'
      : 'transform 0.2s ease-out'
  const opacity = animating ? 0 : 1

  return (
    <div className="space-y-4">
      {/* Top progress indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">
          Card{' '}
          <span className="text-slate-100 font-semibold">{index + 1}</span> of{' '}
          {players.length}
        </span>
        <div className="flex gap-1">
          {players.map((p, i) => (
            <span
              key={p.id}
              className={`h-1.5 rounded-full transition-all ${
                i === index
                  ? 'bg-accent-500 w-6'
                  : i < index
                    ? 'bg-emerald-500/60 w-3'
                    : 'bg-white/15 w-3'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Swipe stage with the current card */}
      <div
        className="swipe-stage relative"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          style={{
            transform: `translate3d(${translatePx}px, 0, 0) rotate(${
              translatePx * 0.04
            }deg)`,
            transition,
            opacity,
          }}
        >
          <PlayerCard
            key={current.id}
            playerName={current.name}
            word={current.isSpy ? pair.spy : pair.civilian}
            isSpy={current.isSpy}
          />
        </div>
      </div>

      {/* Bottom controls + hint */}
      <div className="flex items-center justify-between gap-2 safe-bottom">
        <button
          className="btn-ghost px-4 py-3"
          disabled={isFirst}
          onClick={goPrev}
        >
          ← Prev
        </button>
        <div className="text-center text-xs text-slate-500 leading-tight">
          tap card to flip
          <br />
          swipe ← for next
        </div>
        <button className="btn-primary px-4 py-3" onClick={goNext}>
          {isLast ? 'Done →' : 'Next →'}
        </button>
      </div>
    </div>
  )
}
