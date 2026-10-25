import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Languages, Plus } from 'lucide-react'
import Screen from '../components/Screen'
import { useGame } from '../game/state'
import { iconFor } from '../game/icons'
import { SUPPORTED, setLanguage } from '../i18n'

export default function Options() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const customLists = useGame((s) => s.customLists)
  const currentLang = i18n.language?.split('-')[0] ?? 'en'

  return (
    <Screen title={t('options.title')} back>
      <section>
        <div className="section-label">{t('options.languageLabel')}</div>
        <label className="group-list row relative">
          <span className="row-icon">
            <Languages size={20} />
          </span>
          <span className="flex-1 font-medium">{t(`languages.${currentLang}`)}</span>
          <ChevronRight size={20} className="text-foreground/30 rtl:rotate-180" />
          <select
            value={currentLang}
            onChange={(e) => setLanguage(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={t('options.languageLabel')}
          >
            {SUPPORTED.map((code) => (
              <option key={code} value={code}>
                {t(`languages.${code}`)}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section>
        <div className="section-label">{t('options.wordListsLabel')}</div>
        <div className="group-list">
          {customLists.map((l) => {
            const Icon = iconFor(`custom:${l.id}`, l.icon)
            return (
              <button
                key={l.id}
                type="button"
                className="row"
                onClick={() => navigate(`/lists/${l.id}`)}
              >
                <span className="row-icon">
                  <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{l.name}</span>
                  <span className="block text-sm muted">
                    {t('words.pairCount', { count: l.pairs.length })}
                  </span>
                </span>
                <ChevronRight size={20} className="text-foreground/30 rtl:rotate-180" />
              </button>
            )
          })}
          <button type="button" className="row" onClick={() => navigate('/lists/new')}>
            <span className="row-icon">
              <Plus size={20} />
            </span>
            <span className="flex-1 font-medium">{t('words.newList')}</span>
          </button>
        </div>
        <p className="px-1 pt-2 text-sm muted">{t('options.wordListsHint')}</p>
      </section>
    </Screen>
  )
}
