import type { GameState, Pair, Player } from './types'

export type SpyCountRange = { min: number; max: number }
export type SpyCountSetting = number | SpyCountRange | 'random'

export function maxSpiesFor(playerCount: number): number {
  // Spies must be strictly fewer than half the players (civilians always majority).
  return Math.max(1, Math.floor((playerCount - 1) / 2))
}

export function isSpyCountRange(s: SpyCountSetting): s is SpyCountRange {
  return typeof s === 'object' && s !== null && 'min' in s && 'max' in s
}

export function clampSpyCount(spyCount: number, playerCount: number): number {
  if (!Number.isFinite(spyCount) || spyCount < 1) return 1
  return Math.min(Math.floor(spyCount), maxSpiesFor(playerCount))
}

export function resolveSpyCount(
  spyCount: SpyCountSetting,
  playerCount: number,
): number {
  const max = maxSpiesFor(playerCount)
  if (spyCount === 'random') {
    return 1 + Math.floor(Math.random() * max)
  }
  if (isSpyCountRange(spyCount)) {
    const lo = Math.max(1, Math.min(Math.floor(spyCount.min), max))
    const hi = Math.max(lo, Math.min(Math.floor(spyCount.max), max))
    return lo + Math.floor(Math.random() * (hi - lo + 1))
  }
  return clampSpyCount(spyCount, playerCount)
}

export function assignRoles(
  players: Player[],
  spyCount: SpyCountSetting = 1,
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

export function pickFirstClueGiver(players: Player[]): string {
  return players[Math.floor(Math.random() * players.length)].id
}

export function startRoundState(
  players: Player[],
  pair: Pair,
  prevRound: number,
  spyCount: SpyCountSetting = 1,
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
