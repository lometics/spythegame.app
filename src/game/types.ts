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
 *  easy   = spy gets no hint at all (pure bluffing — easiest to catch)
 *  medium = spy's hint is a sibling civilian from the same category
 *  hard   = spy's hint is the curated close word in the same category — classic
 */
export type Difficulty = 'easy' | 'medium' | 'hard'

export type GameSettings = {
  timerSeconds: number
  pairSource: PairSource
  difficulty: Difficulty
  spyCount: number | { min: number; max: number }
  spiesKnowEachOther: boolean
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
  onlineName: string
  joinCode: string
}
