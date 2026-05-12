import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import de from './locales/de.json'
import fr from './locales/fr.json'
import it from './locales/it.json'
import es from './locales/es.json'
import pt from './locales/pt.json'
import nl from './locales/nl.json'
import pl from './locales/pl.json'
import sv from './locales/sv.json'
import tr from './locales/tr.json'
import ru from './locales/ru.json'
import ja from './locales/ja.json'
import zh from './locales/zh.json'
import ko from './locales/ko.json'
import ar from './locales/ar.json'

export const SUPPORTED = ['en', 'de', 'fr', 'it', 'es', 'pt', 'nl', 'pl', 'sv', 'tr', 'ru', 'ja', 'zh', 'ko', 'ar'] as const
export type Lang = (typeof SUPPORTED)[number]

const RTL_LANGS: ReadonlySet<string> = new Set(['ar'])

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { t: en },
      de: { t: de },
      fr: { t: fr },
      it: { t: it },
      es: { t: es },
      pt: { t: pt },
      nl: { t: nl },
      pl: { t: pl },
      sv: { t: sv },
      tr: { t: tr },
      ru: { t: ru },
      ja: { t: ja },
      zh: { t: zh },
      ko: { t: ko },
      ar: { t: ar },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED,
    defaultNS: 't',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  })

const syncHtml = (lng: string) => {
  const base = (lng || 'en').split('-')[0]
  document.documentElement.lang = base
  document.documentElement.dir = RTL_LANGS.has(base) ? 'rtl' : 'ltr'
  document.title = i18n.t('meta.title')
}
syncHtml(i18n.language)
i18n.on('languageChanged', syncHtml)

export default i18n
