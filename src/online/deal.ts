import type { Pair } from '../game/types'

/** What one player may read about the round (`privateWords/$code/$uid`). */
export type PrivateCard = {
  word: string
  isSpy: boolean
  /** Other spies, when spies know each other. */
  fellowSpyNames?: string[]
  /** The spy's hint, shown to civilians when that setting is on and there is a hint. */
  spyHint?: string
}

/** Every player's private card for a round. */
export function privateCards(
  pair: Pair,
  uids: string[],
  spyUids: string[],
  names: Record<string, string>,
  { spiesKnowEachOther, civiliansSeeHint }: { spiesKnowEachOther: boolean; civiliansSeeHint: boolean },
): Record<string, PrivateCard> {
  const spies = new Set(spyUids)
  return Object.fromEntries(
    uids.map((uid) => {
      const isSpy = spies.has(uid)
      const card: PrivateCard = { word: isSpy ? pair.spy : pair.civilian, isSpy }
      if (isSpy && spiesKnowEachOther) {
        card.fellowSpyNames = spyUids
          .filter((u) => u !== uid)
          .map((u) => names[u] ?? '')
          .filter((name) => name.length > 0)
      }
      if (!isSpy && civiliansSeeHint && pair.spy) card.spyHint = pair.spy
      return [uid, card]
    }),
  )
}
