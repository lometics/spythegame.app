import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

/** Bottom sheet on phones, centered dialog on wider screens. */
export default function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
}) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-sheet max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-surface px-4 pt-2 pb-[max(env(safe-area-inset-bottom),1rem)] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-foreground/20 sm:hidden" />
        <div className="flex items-center gap-2 pb-3">
          <h2 className="flex-1 text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon -mr-2"
            aria-label={t('common.close')}
          >
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
