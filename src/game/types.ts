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
}

export type GamePhase = 'lobby' | 'reveal' | 'discussion' | 'result'

export type PairSource = {
  selectedCategoryIds: string[]
}

export type GameSettings = {
  timerSeconds: number
  pairSource: PairSource
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
