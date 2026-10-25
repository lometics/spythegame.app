import { useTranslation } from 'react-i18next'

/**
 * Inline "are you sure?" for the bottom action bar. Replaces the button that
 * asked, so confirming never covers the screen with a dialog.
 */
export default function ConfirmBar({
  question,
  confirmLabel,
  onConfirm,
  onCancel,
  danger = false,
}: {
  question: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="animate-in space-y-2" role="group" aria-label={question}>
      <p className="px-1 text-center text-sm muted">{question}</p>
      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button
          type="button"
          className={`${danger ? 'btn-danger' : 'btn-primary'} flex-1`}
          onClick={onConfirm}
          autoFocus
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}
