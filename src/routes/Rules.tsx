import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Screen from '../components/Screen'

const STEPS = ['s1', 's2', 's3', 's4'] as const

/** The rules in four short steps. */
export default function Rules() {
  const { t } = useTranslation()
  return (
    <Screen
      title={t('rules.title')}
      back="/"
      footer={
        <Link to="/" className="btn-primary w-full">
          {t('rules.play')}
        </Link>
      }
    >
      <ol className="space-y-3">
        {STEPS.map((step, i) => (
          <li key={step} className="card flex items-start gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-background">
              {i + 1}
            </span>
            <span className="pt-1">{t(`rules.${step}`)}</span>
          </li>
        ))}
      </ol>
      <p className="px-1 muted">{t('rules.win')}</p>
      <p className="px-1 text-sm muted">{t('rules.players')}</p>
    </Screen>
  )
}
