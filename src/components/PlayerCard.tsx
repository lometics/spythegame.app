import { useState } from 'react'

type Props = {
  playerName: string
  word: string
  isSpy: boolean
  /** When true, the card never auto-hides on prop change — used by online mode where the card belongs to one viewer. */
  persistFlip?: boolean
}

/**
 * A flippable card. Back = "Player X — tap to reveal". Front = role + word.
 *
 * Tap toggles the flip. Swipes are handled by the parent (`RevealDeck`) — the
 * browser only fires `click` when movement was small, so swipes don't
 * accidentally flip the card.
 */
export default function PlayerCard({
  playerName,
  word,
  isSpy,
  persistFlip = false,
}: Props) {
  const [flipped, setFlipped] = useState(false)
  void persistFlip

  const onClick = () => setFlipped((f) => !f)

  return (
    <div
      className={`flip-card w-full ${flipped ? 'flipped' : ''}`}
      style={{ aspectRatio: '3 / 4', minHeight: 'min(520px, 70vh)' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setFlipped((f) => !f)
        }
      }}
    >
      <div className="flip-card-inner">
        {/* BACK — what the player sees before flipping */}
        <div className="flip-card-face bg-ink-800 border border-white/10 shadow-soft p-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-500">
            <span>Spy</span>
            <span>🕵️</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="text-6xl">📲</div>
            <div className="text-slate-400">Pass to</div>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold">
              {playerName}
            </h2>
            <div className="text-slate-500 text-sm max-w-xs">
              When it's safe, tap the card to reveal your word.
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 uppercase tracking-widest">
            tap to flip
          </div>
        </div>

        {/* FRONT — the word + role */}
        <div
          className={`flip-card-face flip-card-back p-6 border-2 shadow-soft ${
            isSpy
              ? 'bg-rose-500/10 border-rose-500/60'
              : 'bg-emerald-500/5 border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
            <span>{playerName}</span>
            <span>{isSpy ? '🕵️ Spy' : '✅ Civilian'}</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
            {isSpy ? (
              <>
                <div className="inline-block bg-rose-500 text-white px-4 py-1.5 rounded-full text-sm font-extrabold uppercase tracking-widest">
                  🕵️ You are the spy
                </div>
                <p className="text-rose-200 text-sm max-w-xs leading-relaxed">
                  <strong className="text-rose-100">Heads up:</strong> this
                  word is <em>not</em> what the others have. It's a similar{' '}
                  <strong className="text-rose-100">hint</strong>. Don't say
                  it out loud.
                </p>
                <div className="label text-rose-300/80 mt-2">Your hint</div>
                <div className="font-display text-5xl sm:text-6xl font-extrabold text-rose-100 break-words max-w-full">
                  {word}
                </div>
                <p className="text-rose-300/70 text-xs max-w-xs">
                  Bluff your clues — make them fit your word AND theirs.
                </p>
              </>
            ) : (
              <>
                <div className="inline-block bg-emerald-500 text-ink-900 px-4 py-1.5 rounded-full text-sm font-extrabold uppercase tracking-widest">
                  ✅ Civilian
                </div>
                <p className="text-emerald-100/80 text-sm max-w-xs">
                  Everyone else (except the spy) has this same word. Find the
                  spy.
                </p>
                <div className="label text-emerald-300/80 mt-2">Your word</div>
                <div className="font-display text-5xl sm:text-6xl font-extrabold text-emerald-100 break-words max-w-full">
                  {word}
                </div>
              </>
            )}
          </div>
          <div className="text-center text-xs text-slate-400 uppercase tracking-widest">
            tap to hide
          </div>
        </div>
      </div>
    </div>
  )
}
