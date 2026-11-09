import type { Pair } from '../game/types'
import { dealCard, type Card, type CardFlags } from '../game/cards'

/** What one player may read about the round (`privateWords/$code/$uid`). */
export type PrivateCard = Card

/** Every player's private card for a round. */
export function privateCards(
  pair: Pair,
  uids: string[],
  spyUids: string[],
  names: Record<string, string>,
  flags: CardFlags,
): Record<string, PrivateCard> {
  const spies = new Set(spyUids)
  return Object.fromEntries(
    uids.map((uid) => {
      const others = spyUids.filter((u) => u !== uid).map((u) => names[u] ?? '')
      return [uid, dealCard(pair, spies.has(uid), others, flags)]
    }),
  )
}
