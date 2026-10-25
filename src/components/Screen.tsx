import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'

type Props = {
  title?: ReactNode
  /** Path to go to, a handler, or `true` for history back. Omit for no back button. */
  back?: string | (() => void) | true
  right?: ReactNode
  children: ReactNode
  /** Sticky bottom actions (primary button etc.). */
  footer?: ReactNode
}

/** Page shell: top bar, scrolling content, sticky bottom action area. */
export default function Screen({ title, back, right, children, footer }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const onBack = () => {
    if (typeof back === 'function') back()
    else if (typeof back === 'string') navigate(back)
    else navigate(-1)
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="safe-top sticky top-0 z-20 -mx-4 bg-background/90 px-2 backdrop-blur">
        <div className="flex h-14 items-center gap-1">
          {back !== undefined ? (
            <button
              type="button"
              onClick={onBack}
              className="btn-icon"
              aria-label={t('common.back')}
            >
              <ChevronLeft size={26} className="rtl:rotate-180" />
            </button>
          ) : (
            <span className="w-11" />
          )}
          <h1 className="flex-1 truncate text-center text-[17px] font-semibold">
            {title}
          </h1>
          <div className="flex w-11 justify-end">{right}</div>
        </div>
      </header>
      <div className="animate-in flex flex-1 flex-col gap-6 pt-2">
        {children}
      </div>
      {footer && <div className="action-bar flex flex-col gap-2">{footer}</div>}
    </div>
  )
}
