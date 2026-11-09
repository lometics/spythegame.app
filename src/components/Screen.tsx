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
  /**
   * On tablets and desktops content sits in a centred, readable column; `wide`
   * pages (dashboards, grids) use the whole container instead.
   */
  wide?: boolean
}

/** Page shell: top bar, scrolling content, sticky bottom action area. */
export default function Screen({ title, back, right, children, footer, wide }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const onBack = () => {
    if (typeof back === 'function') back()
    else if (typeof back === 'string') navigate(back)
    else navigate(-1)
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="safe-top sticky top-0 z-20 -mx-4 bg-background/90 px-2 backdrop-blur md:-mx-8 md:px-6">
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
      <div
        className={`animate-in flex flex-1 flex-col gap-6 pt-2 ${
          wide ? 'md:pt-4' : 'md:mx-auto md:w-full md:max-w-2xl md:pt-4'
        }`}
      >
        {children}
      </div>
      {footer && (
        <div className="action-bar flex flex-col gap-2 md:flex-row md:px-[max(0px,calc((100%-42rem)/2))] md:flex-wrap md:items-end md:[&>*]:flex-1 md:[&>p]:basis-full">
          {footer}
        </div>
      )}
    </div>
  )
}
