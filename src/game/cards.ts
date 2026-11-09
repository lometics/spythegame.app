import type { Difficulty, GameSettings, Pair } from './types'

/**
 * Hint levels that hand the spy something that reads like a real word, so a
 * spy can play without being told they are the spy. With only a category or
 * no hint the card would give the role away.
 */
export const UNAWARE_HINTS: readonly Difficulty[] = ['word', 'close']

export type CardFlags = Pick<
  GameSettings,
  'unawareSpy' | 'spiesKnowEachOther' | 'civiliansSeeHint'
>

/**
 * Which card extras actually apply with this hint level. An unaware spy wins
 * over the other two: telling spies about each other or showing civilians the
 * spy's word would let the spy work out their role.
 */
export function cardRules(flags: CardFlags, hintLevel: Difficulty) {
  const unawareSpy = flags.unawareSpy && UNAWARE_HINTS.includes(hintLevel)
  return {
    unawareSpy,
    spiesKnowEachOther: flags.spiesKnowEachOther && !unawareSpy,
    civiliansSeeHint: flags.civiliansSeeHint && !unawareSpy && hintLevel !== 'none',
  }
}

/** What one player's card shows. */
export type Card = {
  word: string
  /** Shown role; false for a spy who is not told. */
  isSpy: boolean
  /** Other spies, when spies know each other. */
  fellowSpyNames?: string[]
  /** The spy's hint, shown to civilians when that setting is on and there is a hint. */
  spyHint?: string
  /** Nobody is told their role this round. */
  unaware?: true
}

/** The card for one player; `otherSpyNames` are the round's other spies. */
export function dealCard(
  pair: Pair,
  isSpy: boolean,
  otherSpyNames: string[],
  flags: CardFlags,
): Card {
  const rules = cardRules(flags, pair.hintLevel ?? 'word')
  const word = isSpy ? pair.spy : pair.civilian
  if (rules.unawareSpy) return { word, isSpy: false, unaware: true }
  const card: Card = { word, isSpy }
  if (isSpy && rules.spiesKnowEachOther) {
    card.fellowSpyNames = otherSpyNames.filter((name) => name.length > 0)
  }
  if (!isSpy && rules.civiliansSeeHint && pair.spy) card.spyHint = pair.spy
  return card
}
