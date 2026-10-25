import type { OnlinePlayer } from './room'

export type RosterEntry = OnlinePlayer & { id: string }

/** Players in join order (RTDB returns keys sorted by uid, which is random). */
export function sortedRoster(
  players: Record<string, OnlinePlayer>,
): RosterEntry[] {
  return Object.entries(players)
    .map(([id, p]) => ({ id, ...p }))
    .sort(
      (a, b) =>
        (a.joinedAt ?? 0) - (b.joinedAt ?? 0) || a.id.localeCompare(b.id),
    )
}

/** Pull a 4-char room code out of a scanned QR (room link) or typed text. */
export function extractRoomCode(scanned: string): string | null {
  const trimmed = scanned.trim()
  const m = trimmed.match(/\/(?:join|room)\/([A-Za-z0-9]{4})(?![A-Za-z0-9])/)
  if (m) return m[1].toUpperCase()
  if (/^[A-Za-z0-9]{4}$/.test(trimmed)) return trimmed.toUpperCase()
  return null
}
