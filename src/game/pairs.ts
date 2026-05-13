import type { TFunction } from 'i18next'
import i18n from '../i18n'
import enPairs from '../data/pairs.en.json'
import dePairs from '../data/pairs.de.json'
import frPairs from '../data/pairs.fr.json'
import itPairs from '../data/pairs.it.json'
import esPairs from '../data/pairs.es.json'
import type { Category, CustomList, Difficulty, Pair, PairSource } from './types'

type RawPair = { civilian: string; spy: string; categoryId: string }
type PairFile = { pairs: RawPair[] }

const PAIR_REGISTRY: Record<string, PairFile> = {
  en: enPairs as PairFile,
  de: dePairs as PairFile,
  fr: frPairs as PairFile,
  it: itPairs as PairFile,
  es: esPairs as PairFile,
}

export const BUILTIN_CATEGORY_IDS = [
  'food',
  'animals',
  'sports',
  'places',
  'tech',
  'entertainment',
  'household',
  'nature',
  'music',
  'jobs',
  'vehicles',
  'clothing',
  'body',
  'myth',
  'tricky',
  'tyrants',
  'darkhumor',
  'prophets',
  'stereotypes',
  'races',
  'terror',
  'infamous',
  'religions',
]

function activePairs(): RawPair[] {
  const lng = i18n.language?.split('-')[0] ?? 'en'
  return (PAIR_REGISTRY[lng] ?? PAIR_REGISTRY.en).pairs
}

export function customCategoryId(listId: string): string {
  return `custom:${listId}`
}

/** All categories visible in the picker (built-in + custom lists), with pair counts. */
export function listCategories(
  customLists: CustomList[],
  t: TFunction,
): Category[] {
  const pairs = activePairs()
  const builtIns: Category[] = BUILTIN_CATEGORY_IDS.map((id) => ({
    id,
    name: t(`categories.${id}.name`),
    description: t(`categories.${id}.description`),
    icon: t(`categories.${id}.icon`),
    isCustom: false,
    pairCount: pairs.filter((p) => p.categoryId === id).length,
  }))
  const customs: Category[] = customLists.map((l) => ({
    id: customCategoryId(l.id),
    name: l.name,
    description: t('customList.description', { count: l.pairs.length }),
    icon: l.icon || '🎴',
    isCustom: true,
    pairCount: l.pairs.length,
  }))
  return [...builtIns, ...customs]
}

/**
 * Sample one pair from the active language's pair file (built-in)
 * unioned with selected custom lists (language-neutral user input).
 *
 * Difficulty is from the villagers' point of view:
 *  - 'hard' (default): curated close spy word in the same category — classic
 *  - 'medium': spy gets a sibling civilian from the same category
 *  - 'easy': spy gets no hint at all (pure bluffing)
 * Medium degrades gracefully when the pool has no sibling in the category.
 */
export function samplePair(
  source: PairSource,
  customLists: CustomList[],
  difficulty: Difficulty = 'hard',
): Pair {
  const selected = new Set(source.selectedCategoryIds)
  const pool: Pair[] = []

  for (const p of activePairs()) {
    if (selected.has(p.categoryId)) {
      pool.push({
        civilian: p.civilian,
        spy: p.spy,
        categoryId: p.categoryId,
      })
    }
  }

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
    throw new Error(i18n.t('online.errNoPairs'))
  }
  const chosen = pool[Math.floor(Math.random() * pool.length)]

  if (difficulty === 'easy') {
    return { ...chosen, spy: '' }
  }
  if (difficulty === 'medium') {
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
  t: TFunction,
): string {
  if (BUILTIN_CATEGORY_IDS.includes(id)) return t(`categories.${id}.name`)
  const customId = id.startsWith('custom:') ? id.slice('custom:'.length) : id
  const list = customLists.find((l) => l.id === customId)
  return list?.name ?? t('customList.fallback')
}

export function totalBuiltInPairs(): number {
  return activePairs().length
}
