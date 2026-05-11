import { useTranslation } from 'react-i18next'
import { SUPPORTED } from '../i18n'

export default function LanguageSwitcher({
  className = '',
}: {
  className?: string
}) {
  const { i18n, t } = useTranslation()
  const current = (i18n.language?.split('-')[0] ?? 'en') as (typeof SUPPORTED)[number]

  return (
    <label className={`inline-flex items-center gap-2 text-xs text-slate-400 ${className}`}>
      <span className="sr-only">{t('languages.label')}</span>
      <span aria-hidden>🌐</span>
      <select
        value={current}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="bg-ink-700/60 border border-white/10 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-accent-500"
        aria-label={t('languages.label')}
      >
        {SUPPORTED.map((code) => (
          <option key={code} value={code} className="bg-ink-800 text-slate-100">
            {t(`languages.${code}`)}
          </option>
        ))}
      </select>
    </label>
  )
}
