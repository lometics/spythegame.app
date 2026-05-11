import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PlayerCard from './PlayerCard'
import type { Pair, Player } from '../game/types'

type Props = {
  players: Player[]
  pair: Pair
  onFinish: () => void
}

const SWIPE_THRESHOLD = 60 // px horizontal delta to count as a swipe

export default function RevealDeck({ players, pair, onFinish }: Props) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [animating, setAnimating] = useState<'left' | 'right' | null>(null)
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)

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
    <div className="space-y-2 sm:space-y-4">
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="text-slate-400">
          {t('revealDeck.cardProgress', {
            current: index + 1,
            total: players.length,
            count: players.length,
          })}
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

      <div
        className="swipe-stage relative w-full"
        style={{ height: 'min(72vh, calc((100vw - 1.5rem) * 4 / 3))' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {[2, 1, 0].map((offset) => {
          const i = index + offset
          if (i >= players.length) return null
          const p = players[i]
          const isTop = offset === 0

          const style: React.CSSProperties = isTop
            ? {
                transform: `translate3d(${translatePx}px, 0, 0) rotate(${
                  translatePx * 0.04
                }deg)`,
                transition,
                opacity,
                zIndex: 3,
              }
            : {
                transform: `translate3d(0, ${offset * 10}px, 0) scale(${
                  1 - offset * 0.05
                })`,
                transformOrigin: 'top center',
                transition: 'transform 0.28s ease-out, opacity 0.28s',
                opacity: 1 - offset * 0.25,
                zIndex: 3 - offset,
                pointerEvents: 'none',
                filter: `brightness(${1 - offset * 0.15})`,
              }

          return (
            <div key={p.id} className="absolute inset-0" style={style}>
              <PlayerCard
                playerName={p.name}
                word={isTop ? (p.isSpy ? pair.spy : pair.civilian) : ''}
                isSpy={isTop ? p.isSpy : false}
                avatar={p.avatar}
              />
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-2 safe-bottom">
        <button
          className="btn-ghost px-3 py-2.5 sm:px-4 sm:py-3 text-sm"
          disabled={isFirst}
          onClick={goPrev}
        >
          {t('revealDeck.prev')}
        </button>
        <div className="text-center text-[10px] sm:text-xs text-slate-500 leading-tight">
          {t('revealDeck.tapHint')}
          <br />
          {t('revealDeck.swipeHint')}
        </div>
        <button className="btn-primary px-3 py-2.5 sm:px-4 sm:py-3 text-sm" onClick={goNext}>
          {isLast ? t('revealDeck.doneBtn') : t('revealDeck.next')}
        </button>
      </div>
    </div>
  )
}
