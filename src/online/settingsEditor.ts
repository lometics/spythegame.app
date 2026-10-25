import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useGame } from '../game/state'
import type { CustomList, GameSettings } from '../game/types'
import {
  clearRoomCategories,
  roomSettingsCache,
  selectAllRoomCategories,
  toggleRoomCategory,
  visibleRoomLists,
  type RoomSettings,
} from './roomSettings'

export type SettingsEditor = {
  /** Room whose shared settings are being edited; null = this device's own. */
  room: string | null
  settings: GameSettings
  /** Custom lists to pick from. */
  lists: CustomList[]
  /** Lists stored on this device, the only ones it can edit. */
  ownListIds: Set<string>
  setSettings: (patch: Partial<GameSettings>) => void
  toggleCategory: (id: string) => void
  selectAll: () => void
  clearAll: () => void
}

// Firebase is only loaded for online play, so the room helpers come in lazily.
const loadRoom = () => import('./room')

/**
 * Settings the setup pages show and change. With `?room=CODE` they are the
 * room's shared settings, live from the database, and every change is saved
 * there for everyone; otherwise the local game's settings.
 */
export function useSettingsEditor(): SettingsEditor {
  const [params] = useSearchParams()
  const room = params.get('room')
  const local = useGame((s) => s.settings)
  const localLists = useGame((s) => s.customLists)
  const setLocal = useGame((s) => s.setSettings)
  const toggleLocal = useGame((s) => s.toggleCategory)
  const selectAllLocal = useGame((s) => s.selectAllCategories)
  const clearLocal = useGame((s) => s.clearCategories)
  const [remote, setRemote] = useState<{ code: string; rs: RoomSettings | null } | null>(
    () => (room ? { code: room, rs: roomSettingsCache.get(room) ?? null } : null),
  )

  useEffect(() => {
    if (!room) return
    let live = true
    let unsub = () => {}
    loadRoom().then((m) => {
      if (live) unsub = m.subscribeRoomSettings(room, (rs) => setRemote({ code: room, rs }))
    })
    return () => {
      live = false
      unsub()
    }
  }, [room])

  const ownListIds = new Set(localLists.map((l) => l.id))
  if (!room) {
    return {
      room: null,
      settings: local,
      lists: localLists,
      ownListIds,
      setSettings: setLocal,
      toggleCategory: toggleLocal,
      selectAll: selectAllLocal,
      clearAll: clearLocal,
    }
  }

  const rs = remote?.code === room ? remote.rs : null
  const save = (next: RoomSettings) => {
    setRemote({ code: room, rs: next })
    loadRoom()
      .then((m) => m.saveRoomSettings(room, next))
      .catch(() => {})
  }
  // Until the room's settings arrive there is nothing safe to change.
  const edit = (fn: (cur: RoomSettings) => RoomSettings) => () => {
    if (rs) save(fn(rs))
  }
  return {
    room,
    settings: rs?.settings ?? local,
    lists: rs ? visibleRoomLists(rs, localLists) : [],
    ownListIds,
    setSettings: (patch) => edit((cur) => ({ ...cur, settings: { ...cur.settings, ...patch } }))(),
    toggleCategory: (id) => edit((cur) => toggleRoomCategory(cur, id, localLists))(),
    selectAll: edit((cur) => selectAllRoomCategories(cur, localLists)),
    clearAll: edit(clearRoomCategories),
  }
}
