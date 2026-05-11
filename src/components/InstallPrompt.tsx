import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  prompt: () => Promise<void>
}

/**
 * Shows an "Install app" button when the browser fires `beforeinstallprompt`.
 * Hides itself once installed, dismissed for the session, or unsupported.
 *
 * On iOS Safari there's no programmatic install; falls back to a brief hint
 * row telling the user to use "Add to Home Screen".
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  )
  const [installed, setInstalled] = useState(
    typeof window !== 'undefined' &&
      window.matchMedia('(display-mode: standalone)').matches,
  )
  const [dismissed, setDismissed] = useState(
    typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem('spy-install-dismissed') === '1',
  )

  useEffect(() => {
    const onBefore = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onBefore)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed || dismissed) return null

  const isIOSSafari =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent))

  if (!deferred && !isIOSSafari) return null

  const dismiss = () => {
    sessionStorage.setItem('spy-install-dismissed', '1')
    setDismissed(true)
  }

  if (deferred) {
    return (
      <div className="card flex items-center gap-3 border-accent-500/40 bg-accent-500/5">
        <div className="text-3xl">📲</div>
        <div className="flex-1">
          <div className="font-semibold text-sm">Install Spy on your phone</div>
          <div className="text-xs text-slate-400">
            Faster opens, works offline, full-screen game.
          </div>
        </div>
        <button
          onClick={async () => {
            await deferred.prompt()
            const choice = await deferred.userChoice
            if (choice.outcome === 'accepted') setInstalled(true)
            setDeferred(null)
          }}
          className="btn-primary px-3 py-2 text-sm"
        >
          Install
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-slate-500 hover:text-slate-200 w-8 h-8"
        >
          ✕
        </button>
      </div>
    )
  }

  // iOS fallback
  return (
    <div className="card flex items-center gap-3 border-accent-500/30 bg-accent-500/5">
      <div className="text-3xl">📲</div>
      <div className="flex-1">
        <div className="font-semibold text-sm">Install on iPhone</div>
        <div className="text-xs text-slate-400">
          Tap the share icon ⎙ in Safari, then{' '}
          <strong className="text-slate-200">Add to Home Screen</strong>.
        </div>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-slate-500 hover:text-slate-200 w-8 h-8"
      >
        ✕
      </button>
    </div>
  )
}
