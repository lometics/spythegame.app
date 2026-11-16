import { useTranslation } from 'react-i18next'
import { Check, CloudOff, Loader2, TriangleAlert, type LucideIcon } from 'lucide-react'
import { useSyncStatus, type SyncState } from '../account/status'

const LOOK: Record<Exclude<SyncState, 'off'>, { icon: LucideIcon; key: string; tone: string; spin?: boolean }> = {
  synced: { icon: Check, key: 'account.statusSynced', tone: 'text-accent' },
  saving: { icon: Loader2, key: 'account.statusSaving', tone: 'muted', spin: true },
  connecting: { icon: Loader2, key: 'account.statusConnecting', tone: 'muted', spin: true },
  offline: { icon: CloudOff, key: 'account.statusOffline', tone: 'muted' },
  error: { icon: TriangleAlert, key: 'account.statusError', tone: 'text-spy' },
}

/** "All changes saved" / "Saving…" / offline, wherever the account shows. */
export default function SyncStatusLine({ className = '' }: { className?: string }) {
  const { t } = useTranslation()
  const state = useSyncStatus((s) => s.state)
  if (state === 'off') return null
  const { icon: Icon, key, tone, spin } = LOOK[state]
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${tone} ${className}`} role="status">
      <Icon size={14} className={spin ? 'animate-spin' : ''} />
      {t(key)}
    </span>
  )
}
