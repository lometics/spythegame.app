import { useTranslation } from 'react-i18next'
import { Eye } from 'lucide-react'

/**
 * A player's secret. Deliberately plain: neutral surface, only the role word
 * is tinted, so nothing bright reflects in glasses or a window.
 */
export function RoleCard({
  name,
  isSpy,
  word,
  fellowSpyNames,
}: {
  name: string
  isSpy: boolean
  word: string
  /** Shown to spies when "spies know each other" is on. */
  fellowSpyNames?: string[]
}) {
  const { t } = useTranslation()
  return (
    <div className="card animate-in flex flex-col items-center gap-6 px-6 py-10 text-center">
      <div className="space-y-1">
        <div className="text-sm muted">{name}</div>
        <div
          className={`text-3xl font-extrabold ${isSpy ? 'text-spy' : 'text-foreground'}`}
        >
          {isSpy ? t('card.spy') : t('card.civilian')}
        </div>
      </div>

      <div className="h-px w-16 bg-border" />

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider muted">
          {isSpy ? t('card.yourHint') : t('card.yourWord')}
        </div>
        {word ? (
          <div className="break-words text-4xl font-bold">{word}</div>
        ) : (
          <div className="text-xl font-semibold muted">{t('card.noHint')}</div>
        )}
        {isSpy && (
          <p className="mx-auto max-w-xs text-sm muted">
            {word ? t('card.spyTip') : t('card.noHintTip')}
          </p>
        )}
      </div>

      {isSpy && fellowSpyNames && (
        <div className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-wider muted">
            {t('card.otherSpies')}
          </div>
          {fellowSpyNames.length > 0 ? (
            <div className="text-lg font-semibold text-spy">
              {fellowSpyNames.join(', ')}
            </div>
          ) : (
            <div className="text-sm muted">{t('card.onlySpy')}</div>
          )}
        </div>
      )}
    </div>
  )
}

/** Covered card: who should take the phone next. */
export function PassCard({ name, avatar }: { name: string; avatar?: string }) {
  const { t } = useTranslation()
  return (
    <div className="card animate-in flex flex-col items-center gap-4 px-6 py-10 text-center">
      {avatar ? (
        <img
          src={avatar}
          alt=""
          className="h-24 w-24 rounded-full border border-border bg-surface-2"
        />
      ) : (
        <div className="row-icon h-24 w-24 rounded-full">
          <Eye size={36} />
        </div>
      )}
      <div className="space-y-1">
        <div className="text-sm muted">{t('card.passTo')}</div>
        <div className="break-words text-3xl font-extrabold">{name}</div>
      </div>
      <p className="max-w-xs text-sm muted">{t('card.passHint')}</p>
    </div>
  )
}
