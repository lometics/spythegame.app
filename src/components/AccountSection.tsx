import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LogOut } from 'lucide-react'
import { FirebaseError } from 'firebase/app'
import { useGame } from '../game/state'
import { isFirebaseConfigured } from '../online/firebase'
import { signInWithGoogle, signOut } from '../account/account'

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  )
}

/** Optional Google sign-in; signed in, settings and word lists sync to the account. */
export default function AccountSection() {
  const { t } = useTranslation()
  const account = useGame((s) => s.account)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!isFirebaseConfigured()) return null

  const signIn = async () => {
    setBusy(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch (e) {
      const code = e instanceof FirebaseError ? e.code : ''
      // Closing the popup is a choice, not an error.
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError(code === 'auth/popup-blocked' ? t('account.popupBlocked') : t('account.failed'))
      }
    } finally {
      setBusy(false)
    }
  }

  const leave = async () => {
    setBusy(true)
    await signOut().catch(() => {})
    setBusy(false)
  }

  return (
    <section>
      <div className="section-label">{t('account.label')}</div>
      <div className="group-list">
        {account ? (
          <>
            <div className="row">
              <span className="row-icon">
                <GoogleLogo />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{account.name || account.email}</span>
                {account.name && account.email && (
                  <span className="block truncate text-sm muted">{account.email}</span>
                )}
              </span>
            </div>
            <button type="button" className="row" onClick={leave} disabled={busy}>
              <span className="row-icon">
                <LogOut size={20} />
              </span>
              <span className="flex-1 font-medium">{t('account.signOut')}</span>
            </button>
          </>
        ) : (
          <button type="button" className="row" onClick={signIn} disabled={busy}>
            <span className="row-icon">
              <GoogleLogo />
            </span>
            <span className="flex-1 font-medium">{t('account.signIn')}</span>
          </button>
        )}
      </div>
      {error && (
        <p className="px-1 pt-2 text-sm text-spy" role="alert">
          {error}
        </p>
      )}
      <p className="px-1 pt-2 text-sm muted">
        {account ? t('account.hintSignedIn') : t('account.hintSignedOut')}
      </p>
    </section>
  )
}
