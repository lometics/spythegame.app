import data from '../data/pairs.json'
import type { Category, CustomList, Difficulty, Pair, PairSource } from './types'

type BuiltInCategory = {
  id: string
  name: string
  description: string
  icon: string
}

type RawPair = { civilian: string; spy: string; categoryId: string }

const BUILTIN_CATEGORIES: BuiltInCategory[] = data.categories as BuiltInCategory[]
const BUILTIN_PAIRS: RawPair[] = data.pairs as RawPair[]

export const BUILTIN_CATEGORY_IDS = BUILTIN_CATEGORIES.map((c) => c.id)

export function customCategoryId(listId: string): string {
  return `custom:${listId}`
}

/** All categories visible in the picker (built-in + custom lists), with pair counts. */
export function listCategories(customLists: CustomList[]): Category[] {
  const builtIns: Category[] = BUILTIN_CATEGORIES.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    icon: c.icon,
    isCustom: false,
    pairCount: BUILTIN_PAIRS.filter((p) => p.categoryId === c.id).length,
  }))
  const customs: Category[] = customLists.map((l) => ({
    id: customCategoryId(l.id),
    name: l.name,
    description: `Your custom list (${l.pairs.length} pairs)`,
    icon: l.icon || '🎴',
    isCustom: true,
    pairCount: l.pairs.length,
  }))
  return [...builtIns, ...customs]
}

/**
 * Sample one pair from the union of all pairs in the selected categories.
 * Difficulty is from the villagers' point of view (how hard it is to spot the spy):
 *  - 'hard' (default): curated close spy word — classic gameplay
 *  - 'medium': spy gets a sibling civilian from the same category
 *  - 'easy': spy gets a random civilian from a DIFFERENT category (very distant)
 *  - 'none': spy gets no hint at all
 *
 * Easy/medium fall back gracefully if the pool can't satisfy them
 * (e.g. only one category selected → easy degrades to medium; single-pair
 * category → medium degrades to hard).
 */
export function samplePair(
  source: PairSource,
  customLists: CustomList[],
  difficulty: Difficulty = 'hard',
): Pair {
  const selected = new Set(source.selectedCategoryIds)
  const pool: Pair[] = []

  // Built-in pairs
  for (const p of BUILTIN_PAIRS) {
    if (selected.has(p.categoryId)) {
      pool.push({
        civilian: p.civilian,
        spy: p.spy,
        categoryId: p.categoryId,
      })
    }
  }

  // Custom list pairs
  for (const list of customLists) {
    const id = customCategoryId(list.id)
    if (!selected.has(id)) continue
    for (const p of list.pairs) {
      const civ = p.civilian.trim()
      const spy = p.spy.trim()
      if (!civ || !spy) continue
      pool.push({ civilian: civ, spy: spy, categoryId: id })
    }
  }

  if (pool.length === 0) {
    throw new Error('No pairs available — select at least one category with pairs.')
  }
  const chosen = pool[Math.floor(Math.random() * pool.length)]

  if (difficulty === 'none') {
    return { ...chosen, spy: '' }
  }
  if (difficulty === 'easy') {
    const siblings = pool.filter(
      (p) => p.categoryId === chosen.categoryId && p.civilian !== chosen.civilian,
    )
    if (siblings.length === 0) return chosen
    const sib = siblings[Math.floor(Math.random() * siblings.length)]
    return { ...chosen, spy: sib.civilian }
  }
  return chosen
}

/** Resolve a category id to its display name (built-in or custom). */
export function categoryName(
  id: string,
  customLists: CustomList[],
): string {
  const builtIn = BUILTIN_CATEGORIES.find((c) => c.id === id)
  if (builtIn) return builtIn.name
  const customId = id.startsWith('custom:') ? id.slice('custom:'.length) : id
  const list = customLists.find((l) => l.id === customId)
  return list?.name ?? 'Custom'
}

export function totalBuiltInPairs(): number {
  return BUILTIN_PAIRS.length
}
