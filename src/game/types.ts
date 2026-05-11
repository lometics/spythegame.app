export type Pair = {
  civilian: string
  spy: string
  /** Stable category identifier (built-in id or `custom:<listId>`) */
  categoryId: string
}

export type Category = {
  id: string
  name: string
  description: string
  icon: string
  isCustom: boolean
  /** Number of pairs currently in this category (computed). */
  pairCount: number
}

export type CustomList = {
  id: string
  name: string
  icon: string
  pairs: Array<{ civilian: string; spy: string }>
  createdAt: number
}

export type Player = {
  id: string
  name: string
  isSpy: boolean
  avatar: string
}

export type GamePhase = 'lobby' | 'reveal' | 'discussion' | 'result'

export type PairSource = {
  selectedCategoryIds: string[]
}

/**
 * Difficulty for the villagers — how hard it is to spot the spy.
 *  easy   = spy's hint is wildly different (random pair from a different category)
 *  medium = spy's hint is loosely related (sibling civilian from same category)
 *  hard   = spy's hint is the curated close word — classic gameplay
 *  none   = spy gets no hint at all (pure bluffing)
 */
export type Difficulty = 'easy' | 'medium' | 'hard' | 'none'

export type GameSettings = {
  timerSeconds: number
  pairSource: PairSource
  difficulty: Difficulty
}

export type GameState = {
  players: Player[]
  phase: GamePhase
  pair: Pair | null
  revealIndex: number
  firstClueGiverId: string | null
  round: number
  settings: GameSettings
  customLists: CustomList[]
}
