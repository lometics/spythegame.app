import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BookOpen,
  ChevronRight,
  PlayCircle,
  RotateCcw,
  Settings,
  Smartphone,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useGame } from '../game/state'

function ModeTile({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string
  icon: LucideIcon
  title: string
  desc: string
}) {
  return (
    <Link to={to} className="option gap-4 py-5">
      <span className="row-icon h-12 w-12 rounded-2xl">
        <Icon size={26} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold leading-tight">{title}</span>
        <span className="block text-sm muted">{desc}</span>
      </span>
      <ChevronRight size={22} className="shrink-0 text-foreground/30 rtl:rotate-180" />
    </Link>
  )
}

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const phase = useGame((s) => s.phase)
  const activeRoom = useGame((s) => s.activeRoom)
  const players = useGame((s) => s.players)
  const startRound = useGame((s) => s.startRound)
  const roundInProgress = phase !== 'lobby' && players.length > 0
  // Returning groups get a one-tap restart with the same players and settings.
  const canQuickPlay = !roundInProgress && players.length >= 3

  const quickPlay = () => {
    if (startRound()) navigate('/local')
    else navigate('/local/play')
  }
  const names =
    players.length > 3
      ? `${players.slice(0, 2).map((p) => p.name).join(', ')} +${players.length - 2}`
      : players.map((p) => p.name).join(', ')

  return (
    <div className="flex flex-1 flex-col">
      <header className="safe-top flex h-14 items-center justify-end">
        <Link to="/options" className="btn-icon" aria-label={t('options.title')}>
          <Settings size={22} />
        </Link>
      </header>

      <div className="flex flex-1 flex-col justify-center gap-10 pb-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <img src="/favicon.svg" alt="" width={80} height={80} className="h-20 w-20" />
          <div>
            <h1 className="text-4xl font-extrabold">{t('home.title')}</h1>
            <p className="mt-1 muted">{t('home.tagline')}</p>
          </div>
        </div>

        <div className="space-y-3">
          {activeRoom && (
            <Link
              to={`/room/${activeRoom}`}
              className="option gap-4 border-accent bg-accent/10 py-4"
            >
              <Users size={26} className="shrink-0 text-accent" />
              <span className="flex-1 font-semibold">
                {t('home.backToRoom', { code: activeRoom })}
              </span>
              <ChevronRight size={22} className="shrink-0 text-foreground/30 rtl:rotate-180" />
            </Link>
          )}
          {roundInProgress && (
            <Link
              to="/local/play"
              className="option gap-4 border-accent bg-accent/10 py-4"
            >
              <PlayCircle size={26} className="shrink-0 text-accent" />
              <span className="flex-1 font-semibold">{t('home.continueRound')}</span>
              <ChevronRight size={22} className="shrink-0 text-foreground/30 rtl:rotate-180" />
            </Link>
          )}
          {canQuickPlay && (
            <button
              type="button"
              onClick={quickPlay}
              className="option gap-4 border-accent bg-accent/10 py-4"
            >
              <RotateCcw size={24} className="shrink-0 text-accent" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{t('home.playAgain')}</span>
                <span className="block truncate text-sm muted">{names}</span>
              </span>
              <span className="flex shrink-0 -space-x-2">
                {players.slice(0, 3).map((p) => (
                  <img
                    key={p.id}
                    src={p.avatar}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full border-2 border-surface bg-surface-2"
                  />
                ))}
              </span>
            </button>
          )}
          <ModeTile
            to="/local"
            icon={Smartphone}
            title={t('home.oneDevice')}
            desc={t('home.oneDeviceDesc')}
          />
          <ModeTile
            to="/online"
            icon={Users}
            title={t('home.ownDevice')}
            desc={t('home.ownDeviceDesc')}
          />
        </div>
      </div>

      <footer className="pb-[max(env(safe-area-inset-bottom),1.25rem)] text-center">
        <Link to="/rules" className="inline-flex min-h-11 items-center gap-1.5 px-3 text-sm muted">
          <BookOpen size={16} />
          {t('home.howToPlay')}
        </Link>
      </footer>
    </div>
  )
}
