import type { GameState, Pair, Player } from './types'

export function assignRoles(players: Player[]): Player[] {
  if (players.length < 3) {
    throw new Error('Need at least 3 players')
  }
  const spyIndex = Math.floor(Math.random() * players.length)
  return players.map((p, i) => ({
    ...p,
    isSpy: i === spyIndex,
  }))
}

export function pickFirstClueGiver(players: Player[]): string {
  return players[Math.floor(Math.random() * players.length)].id
}

export function startRoundState(
  players: Player[],
  pair: Pair,
  prevRound: number,
): Partial<GameState> {
  const assigned = assignRoles(players)
  return {
    players: assigned,
    pair,
    phase: 'reveal',
    revealIndex: 0,
    firstClueGiverId: pickFirstClueGiver(assigned),
    round: prevRound + 1,
  }
}
