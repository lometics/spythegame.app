import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Cloud,
  Layers,
  LogOut,
  Settings2,
  ShieldCheck,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { FirebaseError } from 'firebase/app'
import Screen from '../components/Screen'
import ConfirmBar from '../components/ConfirmBar'
import GoogleLogo from '../components/GoogleLogo'
import AccountBadge from '../components/AccountBadge'
import SyncStatusLine from '../components/SyncStatusLine'
import { useGame } from '../game/state'
import { isFirebaseConfigured } from '../online/firebaseConfig'
import { deleteAccountData, signInWithGoogle, signOut } from '../account/account'

function Perk({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="row-icon">
        <Icon size={20} />
      </span>
      <span className="font-medium">{text}</span>
    </li>
  )
}

/** Optional Google account: signing in, what's synced, signing out. */
export default function Account() {
  const { t } = useTranslation()
  const account = useGame((s) => s.account)
  const listCount = useGame((s) => s.customLists.length)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

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

  const run = (fn: () => Promise<void>) => async () => {
    setBusy(true)
    setConfirmDelete(false)
    setError('')
    await fn().catch(() => setError(t('account.failed')))
    setBusy(false)
  }

  if (!isFirebaseConfigured()) {
    return (
      <Screen title={t('account.title')} back>
        <p className="px-1 muted">{t('account.unavailable')}</p>
      </Screen>
    )
  }

  if (!account) {
    return (
      <Screen
        title={t('account.title')}
        back
        footer={
          <>
            {error && (
              <p className="text-center text-sm text-spy" role="alert">
                {error}
              </p>
            )}
            <button type="button" className="btn-primary w-full" onClick={signIn} disabled={busy}>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white">
                <GoogleLogo size={18} />
              </span>
              {t('account.signIn')}
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center gap-3 pt-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/15 text-accent">
            <Cloud size={34} />
          </span>
          <h2 className="text-2xl font-bold">{t('account.heroTitle')}</h2>
          <p className="muted">{t('account.heroText')}</p>
        </div>
        <ul className="card space-y-3">
          <Perk icon={Layers} text={t('account.perkLists')} />
          <Perk icon={Settings2} text={t('account.perkSettings')} />
          <Perk icon={ShieldCheck} text={t('account.perkPrivate')} />
        </ul>
        <a href="/privacy/" className="mt-auto px-1 pb-2 text-center text-sm muted underline">
          {t('options.privacy')}
        </a>
      </Screen>
    )
  }

  return (
    <Screen
      title={t('account.title')}
      back
      footer={
        confirmDelete ? (
          <ConfirmBar
            question={t('account.deleteConfirm')}
            confirmLabel={t('common.delete')}
            danger
            onCancel={() => setConfirmDelete(false)}
            onConfirm={run(deleteAccountData)}
          />
        ) : (
          <button type="button" className="btn-secondary w-full" onClick={run(signOut)} disabled={busy}>
            <LogOut size={20} />
            {t('account.signOut')}
          </button>
        )
      }
    >
      <div className="flex flex-col items-center gap-2 pt-4 text-center">
        <AccountBadge account={account} size={72} />
        <div>
          <p className="text-xl font-bold">{account.name || account.email}</p>
          {account.name && account.email && <p className="text-sm muted">{account.email}</p>}
        </div>
        <SyncStatusLine />
      </div>

      <section>
        <div className="section-label">{t('account.whatSynced')}</div>
        <div className="group-list">
          <div className="row">
            <span className="row-icon">
              <Layers size={20} />
            </span>
            <span className="flex-1 font-medium">{t('options.wordListsLabel')}</span>
            <span className="tabular-nums muted">{listCount}</span>
          </div>
          <div className="row">
            <span className="row-icon">
              <Settings2 size={20} />
            </span>
            <span className="flex-1 font-medium">{t('account.syncedSettings')}</span>
          </div>
        </div>
        <p className="px-1 pt-2 text-sm muted">{t('account.signOutHint')}</p>
      </section>

      {error && (
        <p className="px-1 text-sm text-spy" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 text-sm text-spy"
        onClick={() => setConfirmDelete(true)}
        disabled={busy}
      >
        <Trash2 size={16} />
        {t('account.deleteData')}
      </button>
    </Screen>
  )
}
