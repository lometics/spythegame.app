import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ChevronRight,
  Lightbulb,
  Library,
  Timer,
  Users,
  VenetianMask,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useGame } from '../game/state'
import { availableSpyCounts } from '../game/machine'
import { BUILTIN_CATEGORY_IDS } from '../game/pairs'

function Row({
  to,
  icon: Icon,
  label,
  value,
  sub,
}: {
  to: string
  icon: LucideIcon
  label: string
  value: ReactNode
  sub?: ReactNode
}) {
  return (
    <Link to={to} className="row">
      <span className="row-icon">
        <Icon size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        {sub && <span className="block truncate text-sm muted">{sub}</span>}
      </span>
      <span className="max-w-[40%] truncate text-right muted">{value}</span>
      <ChevronRight size={20} className="shrink-0 text-foreground/30 rtl:rotate-180" />
    </Link>
  )
}

/** Tappable overview of every round setting; each row opens its own page. */
export default function SettingsSummary({
  playerCount,
  showPlayers,
}: {
  playerCount: number
  showPlayers?: boolean
}) {
  const { t } = useTranslation()
  const settings = useGame((s) => s.settings)
  const players = useGame((s) => s.players)
  const customLists = useGame((s) => s.customLists)
  const q = `?players=${playerCount}`

  const selected = settings.pairSource.selectedCategoryIds
  const totalSources = BUILTIN_CATEGORY_IDS.length + customLists.length
  const wordsValue =
    selected.length === 0
      ? t('setup.none')
      : selected.length >= totalSources
        ? t('setup.allCategories')
        : t('setup.categoryCount', { count: selected.length })

  const spyCounts = availableSpyCounts(settings.spyCount, Math.max(playerCount, 3))
  const spiesValue = spyCounts.join(' / ')
  const spiesSub = [
    spyCounts.length > 1 ? t('setup.randomEachRound') : null,
    settings.spiesKnowEachOther ? t('setup.spiesKnow') : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="group-list">
      {showPlayers && (
        <Row
          to="/setup/players"
          icon={Users}
          label={t('setup.players')}
          value={
            players.length === 0 ? (
              t('setup.none')
            ) : (
              <span className="inline-flex -space-x-2 align-middle">
                {players.slice(0, 4).map((p) => (
                  <img
                    key={p.id}
                    src={p.avatar}
                    alt=""
                    className="h-7 w-7 rounded-full border-2 border-surface bg-surface-2"
                  />
                ))}
              </span>
            )
          }
          sub={t('setup.playerCount', { count: players.length })}
        />
      )}
      <Row
        to="/setup/words"
        icon={Library}
        label={t('setup.words')}
        value={wordsValue}
      />
      <Row
        to={`/setup/spies${q}`}
        icon={VenetianMask}
        label={t('setup.spies')}
        value={spiesValue}
        sub={spiesSub || undefined}
      />
      <Row
        to="/setup/hint"
        icon={Lightbulb}
        label={t('setup.hint')}
        value={t(`hint.${settings.difficulty}.label`)}
      />
      <Row
        to="/setup/timer"
        icon={Timer}
        label={t('setup.timer')}
        value={
          settings.timerSeconds === 0
            ? t('setup.off')
            : t('setup.minutes', { count: settings.timerSeconds / 60 })
        }
      />
    </div>
  )
}
