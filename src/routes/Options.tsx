import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { useGame } from '../game/state'
import { SUPPORTED } from '../i18n'

export default function Options() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const onlineName = useGame((s) => s.onlineName)
  const setOnlineName = useGame((s) => s.setOnlineName)
  const customLists = useGame((s) => s.customLists)
  const deleteList = useGame((s) => s.deleteCustomList)

  const [nameDraft, setNameDraft] = useState(onlineName)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const currentLang = (i18n.language?.split('-')[0] ?? 'en') as (typeof SUPPORTED)[number]

  const commitName = () => {
    const trimmed = nameDraft.trim()
    if (trimmed) setOnlineName(trimmed)
    else setNameDraft(onlineName)
  }

  const confirmTarget = customLists.find((l) => l.id === confirmDeleteId) ?? null

  return (
    <div className="space-y-3 sm:space-y-5 flex flex-col flex-1">
      <nav className="flex items-center justify-between text-xs sm:text-sm">
        <Link to="/" className="inline-flex items-center gap-1.5 text-foreground/60 hover:text-foreground min-h-11 -ml-2 px-2 rounded-md">
          <ArrowLeft size={16} />
          {t('common.back')}
        </Link>
        <span className="text-slate-500">{t('options.header')}</span>
      </nav>

      <header className="text-center pt-1 sm:pt-3">
        <div className="inline-block text-3xl sm:text-5xl mb-1 sm:mb-2">⚙️</div>
        <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight">
          {t('options.title')}
        </h1>
      </header>

      <section className="card space-y-2">
        <label className="label">{t('options.usernameLabel')}</label>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitName()
                ;(e.currentTarget as HTMLInputElement).blur()
              }
            }}
            maxLength={20}
            placeholder={t('online.hostNamePlaceholder')}
            autoCapitalize="words"
          />
        </div>
        <p className="text-[11px] sm:text-xs text-slate-500">
          {t('options.usernameHint')}
        </p>
      </section>

      <section className="card space-y-2">
        <label className="label" htmlFor="opt-language">
          {t('options.languageLabel')}
        </label>
        <select
          id="opt-language"
          value={currentLang}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          className="input"
        >
          {SUPPORTED.map((code) => (
            <option key={code} value={code} className="bg-ink-800 text-slate-100">
              {t(`languages.${code}`)}
            </option>
          ))}
        </select>
      </section>

      <section className="card space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="label">{t('options.wordListsLabel')}</div>
          <button
            type="button"
            onClick={() => navigate('/lists/new')}
            className="text-xs font-semibold text-accent-400 hover:text-accent-500"
          >
            {t('options.newList')}
          </button>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-500">
          {t('options.wordListsHint')}
        </p>
        <ul className="space-y-1.5">
          {customLists.map((l) => (
            <li
              key={l.id}
              className="flex items-center gap-2 bg-ink-700/40 rounded-lg px-2 py-1.5"
            >
              <span className="text-xl shrink-0">{l.icon || '🎴'}</span>
              <button
                type="button"
                onClick={() => navigate(`/lists/${l.id}`)}
                className="flex-1 min-w-0 text-left hover:text-accent-400 transition"
              >
                <div className="font-medium text-sm truncate">{l.name}</div>
                <div className="text-[11px] text-slate-500">
                  {t('pairPicker.pairCount', { count: l.pairs.length })}
                </div>
              </button>
              <button
                type="button"
                onClick={() => navigate(`/lists/${l.id}`)}
                className="text-slate-400 hover:text-slate-100 w-7 h-7 inline-flex items-center justify-center rounded-lg shrink-0"
                aria-label={t('pairPicker.editAria')}
              >
                ✎
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(l.id)}
                className="text-slate-400 hover:text-rose-400 w-7 h-7 inline-flex items-center justify-center rounded-lg shrink-0"
                aria-label={t('common.delete')}
              >
                ✕
              </button>
            </li>
          ))}
          {customLists.length === 0 && (
            <li className="text-xs text-slate-500 italic">
              {t('options.noCustomLists')}
            </li>
          )}
        </ul>
      </section>

      {confirmTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/80 backdrop-blur-sm"
          onClick={() => setConfirmDeleteId(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-ink-800 border border-rose-500/30 p-5 shadow-soft space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-lg">
                🗑
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display font-bold text-base sm:text-lg leading-tight">
                  {t('editList.deleteConfirmTitle')}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 break-words">
                  <span className="text-slate-200 font-medium">
                    {confirmTarget.icon} {confirmTarget.name}
                  </span>
                  <span className="block mt-0.5">
                    {t('editList.deleteConfirmDesc')}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="btn-ghost px-3 py-2 text-sm"
                autoFocus
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  deleteList(confirmTarget.id)
                  setConfirmDeleteId(null)
                }}
                className="btn-danger px-3 py-2 text-sm"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
