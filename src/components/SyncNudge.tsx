import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Cloud, X } from 'lucide-react'
import { useGame } from '../game/state'
import { isFirebaseConfigured } from '../online/firebaseConfig'

/**
 * A quiet tip next to the player's own word lists: sign in to keep them on
 * every device. Hidden once signed in or dismissed, and while there are no own lists.
 */
export default function SyncNudge() {
  const { t } = useTranslation()
  const account = useGame((s) => s.account)
  const hasLists = useGame((s) => s.customLists.length > 0)
  const dismissed = useGame((s) => s.syncNudgeDismissed)
  const dismiss = useGame((s) => s.dismissSyncNudge)
  if (account || !hasLists || dismissed || !isFirebaseConfigured()) return null
  return (
    <div className="card flex items-start gap-3">
      <span className="row-icon">
        <Cloud size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{t('account.nudgeTitle')}</p>
        <p className="text-sm muted">{t('account.nudgeText')}</p>
        <Link to="/account" className="inline-flex min-h-11 items-center font-semibold text-accent">
          {t('account.signInShort')}
        </Link>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="btn-icon -mr-2 -mt-2"
        aria-label={t('account.notNow')}
      >
        <X size={18} />
      </button>
    </div>
  )
}
