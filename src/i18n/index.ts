import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import de from './locales/de.json'

export const SUPPORTED = ['en', 'de'] as const
export type Lang = (typeof SUPPORTED)[number]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { t: en },
      de: { t: de },
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
  document.documentElement.lang = lng
  document.title = i18n.t('meta.title')
}
syncHtml(i18n.language)
i18n.on('languageChanged', syncHtml)

export default i18n
