import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import InstallPrompt from '../components/InstallPrompt'

export default function Home() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <header className="text-center pt-6 sm:pt-12">
        <div className="inline-block text-5xl mb-3">🕵️</div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
          {t('home.title')}
        </h1>
        <p className="text-slate-400 mt-2 max-w-md mx-auto">
          {t('home.subtitle_before')}
          <span className="text-accent-400 font-semibold">
            {t('home.subtitle_highlight')}
          </span>
          {t('home.subtitle_after')}
        </p>
      </header>

      <section className="grid gap-3">
        <Link to="/local" className="card hover:bg-ink-700/60 transition block">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">
                {t('home.passAndPlay.title')}
              </div>
              <div className="text-sm text-slate-400">
                {t('home.passAndPlay.desc')}
              </div>
            </div>
            <div className="text-3xl">📱</div>
          </div>
        </Link>

        <Link
          to="/online"
          className="card hover:bg-ink-700/60 transition block"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">{t('home.host.title')}</div>
              <div className="text-sm text-slate-400">{t('home.host.desc')}</div>
            </div>
            <div className="text-3xl">🌐</div>
          </div>
        </Link>

        <Link to="/join" className="card hover:bg-ink-700/60 transition block">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">{t('home.join.title')}</div>
              <div className="text-sm text-slate-400">{t('home.join.desc')}</div>
            </div>
            <div className="text-3xl">🔑</div>
          </div>
        </Link>
      </section>

      <InstallPrompt />

      <details className="card text-sm text-slate-300">
        <summary className="cursor-pointer font-semibold text-slate-200">
          {t('home.howTo.title')}
        </summary>
        <ol className="mt-3 space-y-2 list-decimal pl-5">
          <li>
            {t('home.howTo.step1_before')}
            <em>{t('home.howTo.step1_spy')}</em>
            {t('home.howTo.step1_mid')}
            <em>{t('home.howTo.step1_similar')}</em>
            {t('home.howTo.step1_after')}
          </li>
          <li>{t('home.howTo.step2')}</li>
          <li>{t('home.howTo.step3')}</li>
        </ol>
      </details>
    </div>
  )
}
