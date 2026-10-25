import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { loadPairs } from '../data/pairStore'
import { loadWords } from '../game/words'

export const SUPPORTED = ['en', 'de', 'fr', 'it', 'es', 'pt', 'nl', 'pl', 'sv', 'tr', 'ru', 'ja', 'zh', 'ko', 'ar'] as const
export type Lang = (typeof SUPPORTED)[number]

const RTL_LANGS: ReadonlySet<string> = new Set(['ar'])

// One chunk per locale: only the active language (plus English fallback) is downloaded.
const locales = import.meta.glob<{ default: Record<string, unknown> }>('./locales/*.json')

export const baseLang = (lng: string | undefined) => (lng || 'en').split('-')[0]

async function loadLanguage(lng: string) {
  const base = baseLang(lng)
  const tasks: Promise<unknown>[] = [loadPairs(base), loadWords(base)]
  if (!i18n.hasResourceBundle(base, 't')) {
    const loader = locales[`./locales/${base}.json`]
    if (loader) {
      tasks.push(loader().then((m) => i18n.addResourceBundle(base, 't', m.default)))
    }
  }
  await Promise.all(tasks)
}

/** Load a language's strings and word list, then switch to it. */
export async function setLanguage(lng: string) {
  await loadLanguage(lng)
  await i18n.changeLanguage(baseLang(lng))
}

const syncHtml = (lng: string) => {
  const base = baseLang(lng)
  document.documentElement.lang = base
  document.documentElement.dir = RTL_LANGS.has(base) ? 'rtl' : 'ltr'
  document.title = i18n.t('meta.title')
}

/** Resolves once the detected language and the English fallback are loaded. */
export const i18nReady = i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {},
    partialBundledLanguages: true,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED,
    nonExplicitSupportedLngs: true,
    defaultNS: 't',
    interpolation: { escapeValue: false },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  })
  .then(() => Promise.all([loadLanguage('en'), loadLanguage(i18n.language)]))
  .then(() => i18n.changeLanguage(baseLang(i18n.language)))
  .then(() => {
    syncHtml(i18n.language)
    i18n.on('languageChanged', syncHtml)
  })

export default i18n
