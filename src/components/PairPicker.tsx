import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Pencil, Plus } from 'lucide-react'
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
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={selectAll}
            className="text-accent-400 hover:text-accent-500 font-semibold min-h-11 px-1"
          >
            {t('pairPicker.selectAll')}
          </button>
          <span className="text-foreground/20">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-foreground/60 hover:text-foreground font-semibold min-h-11 px-1"
          >
            {t('pairPicker.clear')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
        {categories.map((c) => {
          const sel = selectedSet.has(c.id)
          const disabled = c.pairCount === 0
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => !disabled && toggle(c.id)}
              disabled={disabled}
              className={`relative text-left p-3 rounded-xl border transition disabled:opacity-50 ${
                sel
                  ? 'bg-accent-500/15 border-accent-500/70'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <div className="text-2xl leading-none">{c.icon}</div>
                {sel && (
                  <div className="w-5 h-5 rounded-full bg-accent-500 text-ink-900 flex items-center justify-center">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>
              <div className="mt-2 font-semibold text-sm leading-tight">
                {c.name}
              </div>
              <div className="text-xs text-foreground/50 mt-0.5">
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
                  className="absolute top-1 right-1 text-foreground/50 hover:text-foreground w-7 h-7 inline-flex items-center justify-center rounded-full hover:bg-white/5 cursor-pointer"
                  title={t('pairPicker.editAria')}
                >
                  <Pencil size={12} />
                </span>
              )}
            </button>
          )
        })}

        <button
          type="button"
          onClick={openNew}
          className="text-left p-3 rounded-xl border border-dashed border-white/15 bg-transparent hover:bg-white/5 transition flex flex-col"
        >
          <Plus size={22} className="text-foreground/70" strokeWidth={2} />
          <div className="mt-2 font-semibold text-sm leading-tight">
            {t('pairPicker.newList')}
          </div>
          <div className="text-xs text-foreground/50 mt-0.5">
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
