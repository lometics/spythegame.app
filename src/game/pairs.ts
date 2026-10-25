import type { TFunction } from 'i18next'
import i18n from '../i18n'
import { getPairs, type RawPair } from '../data/pairStore'
import { WORD_BANK_CATEGORIES, wordEntries } from './words'
import type { Category, CustomList, Difficulty, Pair, PairSource } from './types'

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

/** One playable word with every kind of hint the spy can get for it. */
type Candidate = {
  civilian: string
  categoryId: string
  hints: { word: string[]; close: string[]; category: string }
}

const lang = () => i18n.language?.split('-')[0] ?? 'en'

/** Old pairs, minus the categories the word bank now covers. */
function activePairs(): RawPair[] {
  return getPairs(lang()).filter((p) => !WORD_BANK_CATEGORIES.has(p.categoryId))
}

/**
 * Old pairs and custom lists only have one curated spy word, which serves as
 * both the decoy and the close hint; the category hint is the category name.
 */
function fromPair(civilian: string, spy: string, categoryId: string, category: string): Candidate {
  return { civilian, categoryId, hints: { word: [spy], close: [spy], category } }
}

function builtInCandidates(): Candidate[] {
  const fromBank: Candidate[] = wordEntries(lang()).map((e) => ({
    civilian: e.word,
    categoryId: e.category,
    hints: { word: e.sibling, close: e.associated, category: e.subName },
  }))
  const fromPairs = activePairs().map((p) =>
    fromPair(p.civilian, p.spy, p.categoryId, i18n.t(`categories.${p.categoryId}.name`)),
  )
  return [...fromBank, ...fromPairs]
}

export function customCategoryId(listId: string): string {
  return `custom:${listId}`
}

/** All categories visible in the picker (built-in + custom lists), with pair counts. */
export function listCategories(
  customLists: CustomList[],
  t: TFunction,
): Category[] {
  const pool = builtInCandidates()
  const builtIns: Category[] = BUILTIN_CATEGORY_IDS.map((id) => ({
    id,
    name: t(`categories.${id}.name`),
    description: t(`categories.${id}.description`),
    isCustom: false,
    pairCount: pool.filter((p) => p.categoryId === id).length,
  }))
  const customs: Category[] = customLists.map((l) => ({
    id: customCategoryId(l.id),
    name: l.name,
    description: t('customList.description', { count: l.pairs.length }),
    icon: l.icon,
    isCustom: true,
    pairCount: l.pairs.length,
  }))
  return [...builtIns, ...customs]
}

const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)]

/** The spy's text for one word at one hint level ('' = no hint). */
function spyHint(c: Candidate, level: Difficulty): string {
  if (level === 'none') return ''
  if (level === 'category') return c.hints.category
  return pick(c.hints[level])
}

/**
 * Sample one word from the selected built-in categories (word bank for the
 * categories it covers, old pairs for the rest) and custom lists, plus the
 * spy's hint for the chosen level.
 */
export function samplePair(
  source: PairSource,
  customLists: CustomList[],
  level: Difficulty = 'close',
): Pair {
  const selected = new Set(source.selectedCategoryIds)
  const pool = builtInCandidates().filter((c) => selected.has(c.categoryId))

  for (const list of customLists) {
    const id = customCategoryId(list.id)
    if (!selected.has(id)) continue
    for (const p of list.pairs) {
      const civ = p.civilian.trim()
      const spy = p.spy.trim()
      if (!civ || !spy) continue
      pool.push(fromPair(civ, spy, id, list.name))
    }
  }

  if (pool.length === 0) {
    throw new Error(i18n.t('online.errNoPairs'))
  }
  const chosen = pick(pool)
  return {
    civilian: chosen.civilian,
    spy: spyHint(chosen, level),
    categoryId: chosen.categoryId,
    hintLevel: level,
  }
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

/**
 * Example for explaining hint levels in the active language: the civilians'
 * word and what the spy would see at each level. Uses the word bank's bakery
 * entry, which has a clear answer for every level.
 */
export function hintExample(): { word: string; hints: Record<Difficulty, string | null> } {
  const bakery = wordEntries(lang()).find((e) => e.id === 'bakery')
  if (!bakery) {
    return {
      word: 'Bakery',
      hints: { word: 'Butcher', close: 'Bread', category: 'Shop', none: null },
    }
  }
  return {
    word: bakery.word,
    hints: {
      word: bakery.sibling[0],
      close: bakery.associated[0],
      category: bakery.subName,
      none: null,
    },
  }
}

export function totalBuiltInPairs(): number {
  return builtInCandidates().length
}
