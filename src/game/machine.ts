import type { GameState, Pair, Player } from './types'

export function maxSpiesFor(playerCount: number): number {
  // Keep at least 2 civilians so the game isn't trivial.
  return Math.max(1, playerCount - 2)
}

export function clampSpyCount(spyCount: number, playerCount: number): number {
  if (!Number.isFinite(spyCount) || spyCount < 1) return 1
  return Math.min(Math.floor(spyCount), maxSpiesFor(playerCount))
}

export function assignRoles(players: Player[], spyCount = 1): Player[] {
  if (players.length < 3) {
    throw new Error('Need at least 3 players')
  }
  const n = clampSpyCount(spyCount, players.length)
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
  spyCount = 1,
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
