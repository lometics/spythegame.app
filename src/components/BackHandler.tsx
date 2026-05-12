import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const GUARD = '__spyBackGuard'

function isAtHome() {
  const h = window.location.hash
  return h === '' || h === '#' || h === '#/'
}

function hasGuard() {
  const s = window.history.state as { [k: string]: unknown } | null
  return !!(s && s[GUARD])
}

function pushGuard() {
  window.history.pushState({ [GUARD]: true }, '')
}

export default function BackHandler() {
  const location = useLocation()
  const { t } = useTranslation()
  const lastBackRef = useRef(0)
  const [showToast, setShowToast] = useState(false)

  // Ensure a guard entry sits on top of history whenever we're at the home
  // route, so the first system back at home is absorbed instead of exiting.
  useEffect(() => {
    if (location.pathname === '/' && !hasGuard()) pushGuard()
  }, [location.pathname, location.key])

  useEffect(() => {
    const onPop = () => {
      if (!isAtHome()) return
      const now = Date.now()
      if (now - lastBackRef.current < 2000) return
      lastBackRef.current = now
      pushGuard()
      setShowToast(true)
      window.setTimeout(() => setShowToast(false), 2000)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (!showToast) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-ink-800/95 border border-white/10 text-foreground text-xs shadow-soft pointer-events-none backdrop-blur-sm">
      {t('app.exitConfirm')}
    </div>
  )
}
