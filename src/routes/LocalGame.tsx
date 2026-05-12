import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { useGame } from '../game/state'
import RevealDeck from '../components/RevealDeck'
import DiscussionTimer from '../components/DiscussionTimer'
import ResultScreen from '../components/ResultScreen'

export default function LocalGame() {
  const { t } = useTranslation()
  const phase = useGame((s) => s.phase)
  const players = useGame((s) => s.players)
  const pair = useGame((s) => s.pair)
  const firstClueGiverId = useGame((s) => s.firstClueGiverId)
  const settings = useGame((s) => s.settings)
  const goToDiscussion = useGame((s) => s.goToDiscussion)
  const revealAnswer = useGame((s) => s.revealAnswer)

  return (
    <div className="space-y-3 flex flex-col flex-1">
      <nav className="flex items-center justify-between text-sm">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-foreground/60 hover:text-foreground min-h-11 -ml-2 px-2 rounded-md"
        >
          <ArrowLeft size={16} />
          {t('common.home')}
        </Link>
        {phase !== 'lobby' && (
          <span className="text-foreground/50">
            {t('localGame.phase')}{' '}
            <span className="text-foreground/80">{phase}</span>
          </span>
        )}
      </nav>

      {phase === 'lobby' && <Navigate to="/" replace />}

      {phase === 'reveal' && pair && players.length > 0 && (
        <RevealDeck
          players={players}
          pair={pair}
          onFinish={goToDiscussion}
          spiesKnowEachOther={settings.spiesKnowEachOther}
        />
      )}

      {phase === 'discussion' && (
        <div className="space-y-4 flex flex-col flex-1">
          <header className="text-center">
            <h2 className="font-display text-xl font-bold">
              {t('localGame.discuss.title')}
            </h2>
            <p className="text-foreground/60 text-sm">
              {t('localGame.discuss.desc')}
            </p>
          </header>

          <section className="card">
            <div className="label mb-2">{t('localGame.discuss.clueOrder')}</div>
            <div className="font-display text-xl font-bold text-accent-400 mb-3">
              {players.find((p) => p.id === firstClueGiverId)?.name}
            </div>
            <ol className="text-sm space-y-1 text-foreground/80">
              {(() => {
                const startIdx = players.findIndex(
                  (p) => p.id === firstClueGiverId,
                )
                return players.map((_, i) => {
                  const p = players[(startIdx + i) % players.length]
                  return (
                    <li key={p.id} className="flex gap-2">
                      <span className="text-foreground/50 w-5">{i + 1}.</span>
                      <span>{p.name}</span>
                    </li>
                  )
                })
              })()}
            </ol>
          </section>

          {settings.timerSeconds > 0 && (
            <section className="card flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="label">{t('localGame.discuss.timerLabel')}</div>
                <div className="text-xs text-foreground/50">
                  {t('localGame.discuss.timerHint')}
                </div>
              </div>
              <DiscussionTimer seconds={settings.timerSeconds} />
            </section>
          )}

          <div className="action-bar">
            <button
              onClick={revealAnswer}
              className="btn-primary w-full py-3.5"
            >
              {t('localGame.discuss.revealBtn')}
            </button>
            <p className="text-center text-xs text-foreground/50 mt-2">
              {t('localGame.discuss.revealHint')}
            </p>
          </div>
        </div>
      )}

      {phase === 'result' && <ResultScreen />}
    </div>
  )
}
