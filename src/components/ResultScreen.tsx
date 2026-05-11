import { Link } from 'react-router-dom'
import { useGame } from '../game/state'
import { categoryName } from '../game/pairs'

export default function ResultScreen() {
  const players = useGame((s) => s.players)
  const pair = useGame((s) => s.pair)
  const customLists = useGame((s) => s.customLists)
  const startRound = useGame((s) => s.startRound)
  const playAgainSamePlayers = useGame((s) => s.playAgainSamePlayers)

  const spy = players.find((p) => p.isSpy)

  return (
    <div className="space-y-6">
      <header className="text-center">
        <div className="text-6xl mb-2">🕵️</div>
        <h2 className="font-display text-3xl font-bold">The reveal</h2>
        <p className="text-slate-400 text-sm mt-1">
          Did you guess right?
        </p>
      </header>

      <section className="card text-center space-y-2">
        <div className="label">The spy was</div>
        <div className="font-display text-3xl font-bold text-rose-300">
          {spy?.name ?? '—'}
        </div>
      </section>

      {pair && (
        <section className="card text-center space-y-3">
          <div className="label">The words</div>
          <div className="flex items-center justify-center gap-6">
            <div>
              <div className="text-xs text-emerald-400 uppercase tracking-wider">
                Civilians
              </div>
              <div className="font-display text-2xl font-bold">
                {pair.civilian}
              </div>
            </div>
            <div className="text-slate-500">vs</div>
            <div>
              <div className="text-xs text-rose-400 uppercase tracking-wider">
                Spy
              </div>
              <div className="font-display text-2xl font-bold">
                {pair.spy || <span className="italic text-slate-400">(no hint)</span>}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Category: {categoryName(pair.categoryId, customLists)}
          </div>
        </section>
      )}

      <div className="grid gap-2 safe-bottom">
        <button
          onClick={() => {
            playAgainSamePlayers()
            startRound()
          }}
          className="btn-primary w-full py-4"
        >
          Play again — same players
        </button>
        <button onClick={playAgainSamePlayers} className="btn-ghost w-full">
          Back to lobby
        </button>
        <Link to="/" className="btn-ghost w-full">
          Home
        </Link>
      </div>
    </div>
  )
}
