import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Screen from '../components/Screen'
import SettingsSummary from '../components/SettingsSummary'
import { useGame } from '../game/state'

/** Round configuration overview for pass-and-play. */
export default function LocalSetup() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const players = useGame((s) => s.players)
  const selected = useGame((s) => s.settings.pairSource.selectedCategoryIds)
  const startRound = useGame((s) => s.startRound)
  const [error, setError] = useState<string | null>(null)

  const blocker =
    players.length < 3
      ? t('players.needMore', { count: 3 - players.length })
      : selected.length === 0
        ? t('words.pickOne')
        : null

  const start = () => {
    const err = startRound()
    if (err) setError(err)
    else navigate('/local/play')
  }

  return (
    <Screen
      title={t('home.oneDevice')}
      back="/"
      footer={
        <>
          {(blocker || error) && (
            <p className="text-center text-sm muted">{blocker ?? error}</p>
          )}
          <button
            type="button"
            className="btn-primary w-full"
            disabled={!!blocker}
            onClick={start}
          >
            {t('setup.start')}
          </button>
        </>
      }
    >
      <SettingsSummary playerCount={players.length} showPlayers />
    </Screen>
  )
}
