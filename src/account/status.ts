import { create } from 'zustand'

/**
 * How syncing with the Google account is going. Kept apart from account.ts so
 * screens can show it without loading Firebase.
 */
export type SyncState = 'off' | 'connecting' | 'synced' | 'saving' | 'offline' | 'error'

export const useSyncStatus = create<{ state: SyncState }>(() => ({ state: 'off' }))

export function setSyncState(state: SyncState) {
  if (useSyncStatus.getState().state !== state) useSyncStatus.setState({ state })
}
