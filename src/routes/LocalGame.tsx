import { Link } from 'react-router-dom'
import { useGame } from '../game/state'
import Lobby from '../components/Lobby'
import RevealDeck from '../components/RevealDeck'
import DiscussionTimer from '../components/DiscussionTimer'
import ResultScreen from '../components/ResultScreen'

export default function LocalGame() {
  const phase = useGame((s) => s.phase)
  const players = useGame((s) => s.players)
  const pair = useGame((s) => s.pair)
  const firstClueGiverId = useGame((s) => s.firstClueGiverId)
  const settings = useGame((s) => s.settings)
  const goToDiscussion = useGame((s) => s.goToDiscussion)
  const revealAnswer = useGame((s) => s.revealAnswer)

  return (
    <div className="space-y-4">
      <nav className="flex items-center justify-between text-sm">
        <Link to="/" className="text-slate-400 hover:text-slate-200">
          ← Home
        </Link>
        {phase !== 'lobby' && (
          <span className="text-slate-500">
            Phase: <span className="text-slate-300">{phase}</span>
          </span>
        )}
      </nav>

      {phase === 'lobby' && <Lobby />}

      {phase === 'reveal' && pair && players.length > 0 && (
        <RevealDeck
          players={players}
          pair={pair}
          onFinish={goToDiscussion}
        />
      )}

      {phase === 'discussion' && (
        <div className="space-y-5">
          <header className="text-center">
            <h2 className="font-display text-2xl font-bold">Discuss</h2>
            <p className="text-slate-400 text-sm">
              Each player says one short clue about their word, then debate it
              out. Decide together who you think is the spy.
            </p>
          </header>

          <section className="card">
            <div className="label mb-2">Clue order — starts with</div>
            <div className="font-display text-xl font-bold text-accent-400 mb-3">
              {players.find((p) => p.id === firstClueGiverId)?.name}
            </div>
            <ol className="text-sm space-y-1 text-slate-300">
              {(() => {
                const startIdx = players.findIndex(
                  (p) => p.id === firstClueGiverId,
                )
                return players.map((_, i) => {
                  const p = players[(startIdx + i) % players.length]
                  return (
                    <li key={p.id} className="flex gap-2">
                      <span className="text-slate-500 w-5">{i + 1}.</span>
                      <span>{p.name}</span>
                    </li>
                  )
                })
              })()}
            </ol>
          </section>

          {settings.timerSeconds > 0 && (
            <section className="card flex items-center justify-between">
              <div>
                <div className="label">Discussion timer</div>
                <div className="text-xs text-slate-500">
                  Pause or reset anytime.
                </div>
              </div>
              <DiscussionTimer seconds={settings.timerSeconds} />
            </section>
          )}

          <div className="safe-bottom">
            <button
              onClick={revealAnswer}
              className="btn-primary w-full py-4"
            >
              Reveal the spy →
            </button>
            <p className="text-center text-xs text-slate-500 mt-2">
              Made up your minds? Tap to see who the spy actually was.
            </p>
          </div>
        </div>
      )}

      {phase === 'result' && <ResultScreen />}
    </div>
  )
}
