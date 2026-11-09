import { useTranslation } from 'react-i18next'
import type { Player } from '../game/types'

/**
 * Who has had the phone so far, as a track of avatars. Anyone up to the
 * furthest player reached can be tapped to go back (or forward again) to them.
 */
export function RevealProgress({
  players,
  current,
  furthest,
  onJump,
}: {
  players: Player[]
  current: number
  furthest: number
  onJump: (index: number) => void
}) {
  const { t } = useTranslation()
  const n = players.length
  // The line runs from the centre of the first avatar to the centre of the last.
  const inset = 50 / n
  const fill = n > 1 ? (current / (n - 1)) * (100 - 2 * inset) : 0

  return (
    <nav aria-label={t('reveal.progress')} className="relative w-full">
      <div
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-surface-2"
        style={{ insetInlineStart: `${inset}%`, insetInlineEnd: `${inset}%` }}
      />
      <div
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-accent transition-all"
        style={{ insetInlineStart: `${inset}%`, width: `${fill}%` }}
      />
      <ol
        className="relative grid gap-1"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      >
        {players.map((p, i) => {
          const reached = i <= furthest
          return (
            <li key={p.id} className="flex justify-center">
              <button
                type="button"
                disabled={!reached || i === current}
                onClick={() => onJump(i)}
                aria-current={i === current ? 'step' : undefined}
                aria-label={t('reveal.goTo', { name: p.name })}
                title={p.name}
                className={`aspect-square w-full max-w-9 overflow-hidden rounded-full border-2 bg-surface-2 transition active:scale-95 ${
                  i === current
                    ? 'scale-110 border-accent'
                    : i < current
                      ? 'border-accent/60'
                      : reached
                        ? 'border-border'
                        : 'border-border opacity-35 grayscale'
                }`}
              >
                <img src={p.avatar} alt="" className="h-full w-full" />
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
