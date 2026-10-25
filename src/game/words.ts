import metaJson from '../data/words/meta.json'
import enWords from '../data/words/en.json'
import deWords from '../data/words/de.json'
import frWords from '../data/words/fr.json'
import itWords from '../data/words/it.json'
import esWords from '../data/words/es.json'

/**
 * Word bank: one entry per secret word, with hints graded by how close
 * they are to the word. See docs/word-bank.md for the writing rules.
 *
 * meta.json holds the language-neutral part (id, category, sub, difficulty);
 * <lang>.json holds the text, keyed by the same ids.
 */

export type WordMeta = {
  id: string
  category: string
  /** Sub-category id, shown to the spy as a hint (level 2). */
  sub: string
  /** How well known the word itself is: 1 = everyone, 3 = niche. */
  difficulty: 1 | 2 | 3
}

export type WordMetaFile = {
  subs: Record<string, string[]>
  entries: WordMeta[]
}

export type WordText = {
  word: string
  /** Linked thing of a different kind (bakery → bread). Hint level 3. */
  associated: string[]
  /** Same kind, different thing (bakery → butcher). Undercover decoy. */
  sibling: string[]
}

export type WordLangFile = {
  /** Display labels for sub-category ids. */
  subs: Record<string, string>
  entries: Record<string, WordText>
}

export type WordEntry = WordMeta & WordText & { subName: string }

export const WORD_META = metaJson as WordMetaFile

export const WORD_LANGS: Record<string, WordLangFile> = {
  en: enWords as WordLangFile,
  de: deWords as WordLangFile,
  fr: frWords as WordLangFile,
  it: itWords as WordLangFile,
  es: esWords as WordLangFile,
}

export const MIN_HINTS_PER_TIER = 2

/** Merged entries for one language (falls back to English). */
export function wordEntries(lang: string): WordEntry[] {
  const file = WORD_LANGS[lang] ?? WORD_LANGS.en
  return WORD_META.entries.map((m) => ({
    ...m,
    ...file.entries[m.id],
    subName: file.subs[m.sub],
  }))
}

const STOPWORDS = new Set([
  'the', 'and', 'of', 'des', 'les', 'aux', 'une', 'del', 'della', 'los', 'las',
  'der', 'die', 'das', 'und', 'von', 'dem', 'den',
])

function tokens(s: string): string[] {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
}

function commonPrefix(a: string, b: string): number {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i
}

/**
 * True when a hint gives the word away by spelling: same token, one token
 * inside the other (corn / popcorn), or a long shared stem (library / librarian).
 */
export function sharesRoot(word: string, hint: string): boolean {
  for (const a of tokens(word)) {
    for (const b of tokens(hint)) {
      if (a === b) return true
      if (Math.min(a.length, b.length) >= 4 && (a.includes(b) || b.includes(a))) return true
      if (commonPrefix(a, b) >= 5) return true
    }
  }
  return false
}

/** All rule violations for one language file against meta. Empty = valid. */
export function validateWordBank(meta: WordMetaFile, lang: string, file: WordLangFile): string[] {
  const issues: string[] = []
  const at = (id: string, msg: string) => issues.push(`[${lang}] ${id}: ${msg}`)

  const seen = new Set<string>()
  for (const m of meta.entries) {
    if (seen.has(m.id)) at(m.id, 'duplicate id')
    seen.add(m.id)
    if (!meta.subs[m.category]?.includes(m.sub)) at(m.id, `sub "${m.sub}" not listed for ${m.category}`)
    if (![1, 2, 3].includes(m.difficulty)) at(m.id, `difficulty ${m.difficulty} not 1-3`)
  }

  for (const sub of Object.values(meta.subs).flat()) {
    if (!file.subs[sub]?.trim()) at(`sub:${sub}`, 'missing label')
  }
  for (const id of Object.keys(file.entries)) {
    if (!seen.has(id)) at(id, 'not in meta')
  }

  for (const m of meta.entries) {
    const e = file.entries[m.id]
    if (!e) {
      at(m.id, 'missing')
      continue
    }
    if (!e.word?.trim()) at(m.id, 'empty word')
    const tiers = { associated: e.associated ?? [], sibling: e.sibling ?? [] }
    const all = new Set<string>()
    for (const [tier, hints] of Object.entries(tiers)) {
      if (hints.length < MIN_HINTS_PER_TIER) at(m.id, `${tier}: needs ${MIN_HINTS_PER_TIER}+ hints`)
      for (const h of hints) {
        if (h !== h.trim() || !h) at(m.id, `${tier}: blank or untrimmed "${h}"`)
        const key = h.trim().toLowerCase()
        if (all.has(key)) at(m.id, `${tier}: duplicate hint "${h}"`)
        all.add(key)
        if (sharesRoot(e.word, h)) at(m.id, `${tier}: "${h}" gives away "${e.word}"`)
      }
    }
  }
  return issues
}
