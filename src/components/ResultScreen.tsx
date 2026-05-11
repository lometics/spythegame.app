import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGame } from '../game/state'
import { categoryName } from '../game/pairs'

export default function ResultScreen() {
  const { t } = useTranslation()
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
        <h2 className="font-display text-3xl font-bold">{t('result.title')}</h2>
        <p className="text-slate-400 text-sm mt-1">{t('result.subtitle')}</p>
      </header>

      <section className="card text-center space-y-2">
        <div className="label">{t('result.spyWas')}</div>
        <div className="font-display text-3xl font-bold text-rose-300">
          {spy?.name ?? '—'}
        </div>
      </section>

      {pair && (
        <section className="card text-center space-y-3">
          <div className="label">{t('result.wordsLabel')}</div>
          <div className="flex items-center justify-center gap-6">
            <div>
              <div className="text-xs text-emerald-400 uppercase tracking-wider">
                {t('result.civilians')}
              </div>
              <div className="font-display text-2xl font-bold">
                {pair.civilian}
              </div>
            </div>
            <div className="text-slate-500">{t('result.vs')}</div>
            <div>
              <div className="text-xs text-rose-400 uppercase tracking-wider">
                {t('result.spy')}
              </div>
              <div className="font-display text-2xl font-bold">
                {pair.spy || (
                  <span className="italic text-slate-400">
                    {t('result.noHint')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {t('result.category', {
              name: categoryName(pair.categoryId, customLists, t),
            })}
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
          {t('result.playAgain')}
        </button>
        <button onClick={playAgainSamePlayers} className="btn-ghost w-full">
          {t('result.backToLobby')}
        </button>
        <Link to="/" className="btn-ghost w-full">
          {t('result.home')}
        </Link>
      </div>
    </div>
  )
}
