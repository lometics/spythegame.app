export type Pair = {
  civilian: string
  spy: string
  /** Stable category identifier (built-in id or `custom:<listId>`) */
  categoryId: string
  /** Which kind of hint `spy` is; missing on rounds saved before hint levels existed. */
  hintLevel?: Difficulty
}

export type Category = {
  id: string
  name: string
  description: string
  /** Icon key for custom lists (see LIST_ICONS); built-ins resolve by id. */
  icon?: string
  isCustom: boolean
  /** Number of pairs currently in this category (computed). */
  pairCount: number
}

export type CustomList = {
  id: string
  name: string
  /** Key into LIST_ICONS. */
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
 * What the spy sees instead of the word, most help first (Bakery as example):
 *  word     = a decoy of the same kind (Butcher), hardest to catch
 *  close    = something linked to the word (Bread)
 *  category = only the kind of thing (Shop)
 *  none     = nothing, pure bluffing
 */
export type Difficulty = 'word' | 'close' | 'category' | 'none'

export const DIFFICULTIES: Difficulty[] = ['word', 'close', 'category', 'none']

export type GameSettings = {
  timerSeconds: number
  pairSource: PairSource
  difficulty: Difficulty
  /** Allowed spy counts; each round picks one at random. */
  spyCount: number[]
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
