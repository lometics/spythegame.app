import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Share, X } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'spy-install-dismissed'

// The browser fires this once, early; keep it until we decide to show the card.
let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferred = e as BeforeInstallPromptEvent
  listeners.forEach((l) => l())
})

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * "Add Spy to your home screen" card, shown after a finished round: the moment
 * people have just enjoyed it and are most likely to want it again.
 */
export default function InstallPrompt() {
  const { t } = useTranslation()
  const [, rerender] = useState(0)
  const [hidden, setHidden] = useState(wasDismissed)

  useEffect(() => {
    const l = () => rerender((n) => n + 1)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])

  if (hidden || isStandalone() || (!deferred && !isIos())) return null

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* private mode: just hide for now */
    }
    setHidden(true)
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    deferred = null
    if (outcome === 'accepted') setHidden(true)
    else rerender((n) => n + 1)
  }

  return (
    <section className="card flex items-start gap-3">
      <span className="row-icon">
        <Download size={20} />
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <div className="font-semibold">{t('install.title')}</div>
          <p className="text-sm muted">
            {deferred ? (
              t('install.desc')
            ) : (
              <>
                {t('install.iosHint')} <Share size={14} className="inline align-[-2px]" />
              </>
            )}
          </p>
        </div>
        {deferred && (
          <button type="button" className="btn-secondary min-h-11 px-4 text-sm" onClick={install}>
            {t('install.button')}
          </button>
        )}
      </div>
      <button
        type="button"
        className="btn-icon -mr-2 -mt-2 text-foreground/50"
        onClick={dismiss}
        aria-label={t('common.close')}
      >
        <X size={18} />
      </button>
    </section>
  )
}
