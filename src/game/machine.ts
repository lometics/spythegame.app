import type { GameState, Pair, Player } from './types'

/** Spy counts the group allows; each round uses one of them at random. */
export type SpyCountSetting = number[]

export function maxSpiesFor(playerCount: number): number {
  // Spies must be strictly fewer than half the players (civilians always majority).
  return Math.max(1, Math.floor((playerCount - 1) / 2))
}

/**
 * The selected counts that fit this many players, ascending. If none fit
 * (say "3 spies" with only 5 players), the round uses the most it can.
 */
export function availableSpyCounts(
  selected: SpyCountSetting,
  playerCount: number,
): number[] {
  const max = maxSpiesFor(playerCount)
  const valid = [...new Set(selected.map(Math.floor))]
    .filter((n) => n >= 1 && n <= max)
    .sort((a, b) => a - b)
  if (valid.length > 0) return valid
  return [Math.min(Math.max(1, ...selected), max)]
}

export function resolveSpyCount(
  selected: SpyCountSetting,
  playerCount: number,
): number {
  const options = availableSpyCounts(selected, playerCount)
  return options[Math.floor(Math.random() * options.length)]
}

/** Add or remove one count; the last remaining count can't be removed. */
export function toggleSpyCount(selected: SpyCountSetting, n: number): number[] {
  if (!selected.includes(n)) return [...selected, n].sort((a, b) => a - b)
  const next = selected.filter((x) => x !== n)
  return next.length > 0 ? next : selected
}

/** Reads any saved shape (old number or {min,max} range) as a list of counts. */
export function normalizeSpyCount(saved: unknown): number[] {
  if (Array.isArray(saved)) {
    const ok = saved.filter((n): n is number => Number.isInteger(n) && n >= 1)
    return ok.length > 0 ? ok : [1]
  }
  if (typeof saved === 'number' && saved >= 1) return [Math.floor(saved)]
  if (saved && typeof saved === 'object' && 'min' in saved && 'max' in saved) {
    const { min, max } = saved as { min: number; max: number }
    const lo = Math.max(1, Math.floor(min))
    const hi = Math.max(lo, Math.floor(max))
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
  }
  return [1]
}

export function assignRoles(
  players: Player[],
  spyCount: SpyCountSetting = [1],
): Player[] {
  if (players.length < 3) {
    throw new Error('Need at least 3 players')
  }
  const n = resolveSpyCount(spyCount, players.length)
  const indices = players.map((_, i) => i)
  // Fisher-Yates shuffle, take first n as spies.
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  const spySet = new Set(indices.slice(0, n))
  return players.map((p, i) => ({ ...p, isSpy: spySet.has(i) }))
}

/** Players rotated so the first clue giver comes first; original order if id is unknown. */
export function clueOrder<T extends { id: string }>(
  players: T[],
  firstId: string | null,
): T[] {
  const start = players.findIndex((p) => p.id === firstId)
  if (start <= 0) return players
  return [...players.slice(start), ...players.slice(0, start)]
}

export function pickFirstClueGiver(players: Player[]): string {
  return players[Math.floor(Math.random() * players.length)].id
}

export function startRoundState(
  players: Player[],
  pair: Pair,
  prevRound: number,
  spyCount: SpyCountSetting = [1],
): Partial<GameState> {
  const assigned = assignRoles(players, spyCount)
  return {
    players: assigned,
    pair,
    phase: 'reveal',
    revealIndex: 0,
    firstClueGiverId: pickFirstClueGiver(assigned),
    round: prevRound + 1,
  }
}
