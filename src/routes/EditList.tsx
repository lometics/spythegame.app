import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGame } from '../game/state'
import type { CustomList } from '../game/types'

type DraftPair = { civilian: string; spy: string }

const SUGGESTED_ICONS = ['🎴', '🎲', '🎯', '🧩', '🍀', '🔥', '💎', '🌟', '⚡', '🎨']

export default function EditList() {
  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const customLists = useGame((s) => s.customLists)
  const upsert = useGame((s) => s.upsertCustomList)
  const deleteList = useGame((s) => s.deleteCustomList)

  const existing = useMemo<CustomList | null>(
    () => (id ? customLists.find((l) => l.id === id) ?? null : null),
    [id, customLists],
  )

  const missing = Boolean(id) && !existing

  const [name, setName] = useState(existing?.name ?? '')
  const [icon, setIcon] = useState(existing?.icon ?? '🎴')
  const [pairs, setPairs] = useState<DraftPair[]>(
    existing?.pairs?.length
      ? existing.pairs.map((p) => ({ civilian: p.civilian, spy: p.spy }))
      : [{ civilian: '', spy: '' }],
  )
  const [confirmDelete, setConfirmDelete] = useState(false)
  const iconInputRef = useRef<HTMLInputElement>(null)
  const lastSpyRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!confirmDelete) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmDelete(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmDelete])

  if (missing) {
    return (
      <div className="space-y-4 flex flex-col flex-1">
        <nav className="text-sm">
          <Link to="/local" className="text-slate-400 hover:text-slate-200">
            {t('common.back')}
          </Link>
        </nav>
        <div className="card">
          <div className="font-semibold">{t('editList.notFound')}</div>
          <div className="text-sm text-slate-400 mt-1">
            {t('editList.notFoundDesc')}
          </div>
        </div>
      </div>
    )
  }

  const updatePair = (i: number, patch: Partial<DraftPair>) => {
    setPairs((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)))
  }
  const addPair = () => {
    setPairs((ps) => [...ps, { civilian: '', spy: '' }])
    // focus the new civilian input on next paint
    requestAnimationFrame(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('[data-pair-civilian]')
      inputs[inputs.length - 1]?.focus()
    })
  }
  const removePair = (i: number) =>
    setPairs((ps) =>
      ps.length <= 1 ? [{ civilian: '', spy: '' }] : ps.filter((_, j) => j !== i),
    )

  const trimmedName = name.trim()
  const validPairs = pairs.filter((p) => p.civilian.trim() && p.spy.trim())
  const validCount = validPairs.length
  const totalPairs = pairs.length
  const canSave = trimmedName.length > 0 && validCount > 0

  const goBack = () => navigate('/local')

  const save = () => {
    if (!canSave) return
    const next: CustomList = {
      id: existing?.id ?? crypto.randomUUID(),
      name: trimmedName,
      icon: icon.trim() || '🎴',
      pairs: validPairs.map((p) => ({
        civilian: p.civilian.trim(),
        spy: p.spy.trim(),
      })),
      createdAt: existing?.createdAt ?? Date.now(),
    }
    upsert(next)
    goBack()
  }

  const remove = () => {
    if (!existing) return
    deleteList(existing.id)
    goBack()
  }

  const onPairKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    i: number,
    field: 'civilian' | 'spy',
  ) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (field === 'civilian') {
      // jump to spy input of same row
      const row = (e.currentTarget.closest('[data-pair-row]') as HTMLElement | null)
      row?.querySelector<HTMLInputElement>('[data-pair-spy]')?.focus()
      return
    }
    // spy: if last row, add new; else focus next civilian
    if (i === pairs.length - 1) addPair()
    else {
      const rows = document.querySelectorAll<HTMLInputElement>('[data-pair-civilian]')
      rows[i + 1]?.focus()
    }
  }

  return (
    <div className="space-y-3 sm:space-y-5 flex flex-col flex-1">
      <nav className="flex items-center justify-between text-xs sm:text-sm">
        <Link to="/local" className="text-slate-400 hover:text-slate-200">
          {t('common.back')}
        </Link>
        <span className="text-slate-500">
          {existing ? t('editList.headerEdit') : t('editList.headerNew')}
        </span>
      </nav>

      {/* Hero: live icon + title preview */}
      <header className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => iconInputRef.current?.focus()}
          className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-accent-500/25 to-accent-500/5 border border-accent-500/30 flex items-center justify-center text-3xl sm:text-4xl shadow-soft hover:from-accent-500/35 transition"
          aria-label={t('editList.icon')}
        >
          {icon || '🎴'}
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl sm:text-3xl font-extrabold tracking-tight truncate">
            {trimmedName || (existing ? t('editList.titleEdit') : t('editList.titleNew'))}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            {t('editList.intro_before')}
            <span className="text-slate-200">{t('editList.intro_similar')}</span>
            {t('editList.intro_after')}
          </p>
        </div>
      </header>

      {/* Identity */}
      <section className="card space-y-3 sm:space-y-4">
        <div>
          <label className="label">{t('editList.name')}</label>
          <input
            className="input mt-1.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('editList.namePlaceholder')}
            maxLength={28}
            autoFocus={!existing}
          />
          <div className="mt-1 text-right text-[10px] text-slate-500 tabular-nums">
            {name.length}/28
          </div>
        </div>

        <div>
          <label className="label">{t('editList.icon')}</label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              ref={iconInputRef}
              className="input w-16 sm:w-20 text-xl sm:text-2xl text-center shrink-0"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength={4}
            />
            <div className="flex-1 flex flex-wrap gap-1 sm:gap-1.5">
              {SUGGESTED_ICONS.map((e) => {
                const active = icon === e
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setIcon(e)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-lg sm:text-xl transition flex items-center justify-center ${
                      active
                        ? 'bg-accent-500/30 ring-2 ring-accent-500 scale-105'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                    aria-pressed={active}
                  >
                    {e}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Pairs */}
      <section className="card space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="label">{t('editList.pairs')}</label>
            <span
              className={`text-[10px] sm:text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded-md ${
                validCount > 0
                  ? 'bg-accent-500/20 text-accent-400'
                  : 'bg-white/5 text-slate-500'
              }`}
              aria-label={`${validCount} of ${totalPairs} pairs ready`}
            >
              {validCount}/{totalPairs}
            </span>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-500">
            {t('editList.pairsHint')}
          </span>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          {pairs.map((p, i) => {
            const complete = p.civilian.trim() && p.spy.trim()
            const isLast = i === pairs.length - 1
            return (
              <div
                key={i}
                data-pair-row
                className={`group relative rounded-xl sm:rounded-2xl p-2 sm:p-2.5 pl-8 sm:pl-10 border transition ${
                  complete
                    ? 'bg-ink-700/50 border-white/10'
                    : 'bg-ink-700/30 border-white/5'
                }`}
              >
                <span
                  className={`absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[10px] sm:text-xs font-bold flex items-center justify-center tabular-nums select-none ${
                    complete
                      ? 'bg-accent-500/20 text-accent-400'
                      : 'bg-white/5 text-slate-500'
                  }`}
                >
                  {i + 1}
                </span>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
                  <input
                    data-pair-civilian
                    className="input flex-1"
                    value={p.civilian}
                    onChange={(e) => updatePair(i, { civilian: e.target.value })}
                    onKeyDown={(e) => onPairKeyDown(e, i, 'civilian')}
                    placeholder={t('editList.civilianPlaceholder')}
                    maxLength={30}
                  />
                  <span
                    className="hidden sm:flex items-center justify-center w-5 text-slate-500 text-sm shrink-0"
                    aria-hidden
                  >
                    →
                  </span>
                  <span
                    className="sm:hidden text-[10px] text-slate-500 pl-1 -mt-0.5 -mb-0.5"
                    aria-hidden
                  >
                    ↓
                  </span>
                  <input
                    ref={isLast ? lastSpyRef : undefined}
                    data-pair-spy
                    className="input flex-1"
                    value={p.spy}
                    onChange={(e) => updatePair(i, { spy: e.target.value })}
                    onKeyDown={(e) => onPairKeyDown(e, i, 'spy')}
                    placeholder={t('editList.spyPlaceholder')}
                    maxLength={30}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removePair(i)}
                  className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-ink-800 border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition flex items-center justify-center text-xs shadow-soft opacity-70 group-hover:opacity-100 focus:opacity-100"
                  aria-label={t('editList.removePairAria')}
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={addPair}
          className="w-full text-sm py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-white/15 hover:border-accent-500/40 text-slate-300 hover:text-slate-100 transition font-medium"
        >
          {t('editList.addPair')}
        </button>
      </section>

      <footer className="action-bar flex items-center justify-between gap-2">
        {existing ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-rose-400/80 hover:text-rose-300 px-2 py-2 text-sm font-medium transition"
          >
            🗑 {t('common.delete')}
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="btn-ghost px-3 py-2 text-sm">
            {t('common.cancel')}
          </button>
          <button
            onClick={save}
            disabled={!canSave}
            className="btn-primary px-3 py-2 text-sm"
          >
            {existing ? t('common.save') : t('editList.create')}
          </button>
        </div>
      </footer>

      {confirmDelete && existing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/80 backdrop-blur-sm"
          onClick={() => setConfirmDelete(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
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
                <h2
                  id="delete-confirm-title"
                  className="font-display font-bold text-base sm:text-lg leading-tight"
                >
                  {t('editList.deleteConfirmTitle')}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 break-words">
                  <span className="text-slate-200 font-medium">
                    {existing.icon} {existing.name}
                  </span>
                  <span className="block mt-0.5">
                    {t('editList.deleteConfirmDesc')}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setConfirmDelete(false)}
                className="btn-ghost px-3 py-2 text-sm"
                autoFocus
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={remove}
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
