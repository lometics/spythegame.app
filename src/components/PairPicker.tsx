import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGame } from '../game/state'
import { listCategories } from '../game/pairs'

export default function PairPicker() {
  const { t } = useTranslation()
  const customLists = useGame((s) => s.customLists)
  const selected = useGame((s) => s.settings.pairSource.selectedCategoryIds)
  const toggle = useGame((s) => s.toggleCategory)
  const selectAll = useGame((s) => s.selectAllCategories)
  const clearAll = useGame((s) => s.clearCategories)

  const navigate = useNavigate()

  const categories = listCategories(customLists, t)
  const selectedSet = new Set(selected)

  const openNew = () => navigate('/lists/new')
  const openEdit = (categoryId: string) => {
    const list = customLists.find((l) => `custom:${l.id}` === categoryId)
    if (!list) return
    navigate(`/lists/${list.id}`)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="label">{t('pairPicker.label')}</div>
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={selectAll}
            className="text-accent-400 hover:text-accent-500 font-semibold"
          >
            {t('pairPicker.selectAll')}
          </button>
          <span className="text-slate-700">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-slate-400 hover:text-slate-200 font-semibold"
          >
            {t('pairPicker.clear')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {categories.map((c) => {
          const sel = selectedSet.has(c.id)
          const disabled = c.pairCount === 0
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => !disabled && toggle(c.id)}
              disabled={disabled}
              className={`relative text-left p-3 rounded-2xl border transition disabled:opacity-50 ${
                sel
                  ? 'bg-accent-500/15 border-accent-500/70'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-2xl leading-none">{c.icon}</div>
                {sel && (
                  <div className="w-5 h-5 rounded-full bg-accent-500 text-ink-900 text-xs font-bold flex items-center justify-center">
                    ✓
                  </div>
                )}
              </div>
              <div className="mt-2 font-semibold text-sm leading-tight">
                {c.name}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {t('pairPicker.pairCount', { count: c.pairCount })}
              </div>
              {c.isCustom && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    openEdit(c.id)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      openEdit(c.id)
                    }
                  }}
                  className="absolute top-1 right-1 text-slate-400 hover:text-slate-100 text-xs px-1.5 py-0.5 rounded cursor-pointer"
                  title={t('pairPicker.editAria')}
                >
                  ✎
                </span>
              )}
            </button>
          )
        })}

        <button
          type="button"
          onClick={openNew}
          className="text-left p-3 rounded-2xl border border-dashed border-white/15 bg-transparent hover:bg-white/5 transition flex flex-col"
        >
          <div className="text-2xl leading-none">＋</div>
          <div className="mt-2 font-semibold text-sm leading-tight">
            {t('pairPicker.newList')}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {t('pairPicker.newListDesc')}
          </div>
        </button>
      </div>

      {selected.length === 0 && (
        <p className="text-xs text-rose-300/80">
          {t('pairPicker.pickAtLeastOne')}
        </p>
      )}
    </div>
  )
}
