import { describe, expect, it, vi } from 'vitest'

vi.mock('../i18n', () => ({ default: { language: 'en', t: (k: string) => k } }))

const { hintExample, listCategories, samplePair } = await import('./pairs')
await (await import('../data/pairStore')).loadPairs('en')
const { loadWords, wordEntries } = await import('./words')
await loadWords('en')

const list = {
  id: 'l1',
  name: 'Mine',
  icon: 'layers',
  createdAt: 0,
  pairs: [
    { civilian: 'Cat', spy: 'Lynx' },
    { civilian: 'Dog', spy: 'Wolf' },
    { civilian: '  ', spy: 'blank civilian is skipped' },
  ],
}
const onlyCustom = { selectedCategoryIds: ['custom:l1'] }
const places = { selectedCategoryIds: ['places'] }
const bank = new Map(wordEntries('en').map((e) => [e.word, e]))

describe('samplePair: custom lists', () => {
  it('word and close: the curated spy word', () => {
    for (const level of ['word', 'close'] as const) {
      for (let i = 0; i < 30; i++) {
        const p = samplePair(onlyCustom, [list], level)
        expect([['Cat', 'Lynx'], ['Dog', 'Wolf']]).toContainEqual([p.civilian, p.spy])
        expect(p.hintLevel).toBe(level)
      }
    }
  })
  it('category: the list name', () => {
    expect(samplePair(onlyCustom, [list], 'category').spy).toBe('Mine')
  })
  it('none: no hint', () => {
    expect(samplePair(onlyCustom, [list], 'none').spy).toBe('')
  })
})

describe('samplePair: word bank categories', () => {
  it('word: one of the decoys', () => {
    for (let i = 0; i < 50; i++) {
      const p = samplePair(places, [], 'word')
      expect(bank.get(p.civilian)?.sibling).toContain(p.spy)
    }
  })
  it('close: one of the associated hints', () => {
    for (let i = 0; i < 50; i++) {
      const p = samplePair(places, [], 'close')
      expect(bank.get(p.civilian)?.associated).toContain(p.spy)
    }
  })
  it('category: the sub-category name', () => {
    for (let i = 0; i < 50; i++) {
      const p = samplePair(places, [], 'category')
      expect(p.spy).toBe(bank.get(p.civilian)?.subName)
    }
  })
  it('never deals a grade C word', async () => {
    const { WORD_META } = await import('./words')
    const graded = WORD_META.entries.filter((e) => e.category === 'tech')
    const cWords = new Set(
      wordEntries('en').filter((e) => e.grade === 'C' && e.category === 'tech').map((e) => e.word),
    )
    expect(graded.length).toBeGreaterThan(cWords.size)
    expect(cWords.size).toBeGreaterThan(0)
    for (let i = 0; i < 300; i++) {
      expect(cWords.has(samplePair({ selectedCategoryIds: ['tech'] }, []).civilian)).toBe(false)
    }
  })
  it('replaces the old pairs of that category', () => {
    for (let i = 0; i < 50; i++) {
      expect(bank.has(samplePair(places, []).civilian)).toBe(true)
    }
  })
})

describe('samplePair', () => {
  it('defaults to the close hint', () => {
    expect(samplePair(places, []).hintLevel).toBe('close')
  })
  it('throws when nothing is selected', () => {
    expect(() => samplePair({ selectedCategoryIds: [] }, [list])).toThrow()
  })
  it('only draws from selected built-in categories', () => {
    for (let i = 0; i < 50; i++) {
      expect(samplePair({ selectedCategoryIds: ['animals'] }, []).categoryId).toBe('animals')
    }
  })
  it('old-pair categories use the category name as category hint', () => {
    expect(samplePair({ selectedCategoryIds: ['tricky'] }, [], 'category').spy).toBe(
      'categories.tricky.name',
    )
  })
})

describe('defaultCategoryIds', () => {
  it('leaves out sensitive categories and off-season packs', async () => {
    const { SENSITIVE_CATEGORY_IDS, defaultCategoryIds } = await import('./pairs')
    const ids = defaultCategoryIds('halloween')
    for (const id of SENSITIVE_CATEGORY_IDS) expect(ids).not.toContain(id)
    expect(ids).toContain('halloween')
    expect(ids).not.toContain('christmas')
    expect(ids).toContain('food')
    expect(defaultCategoryIds(null)).not.toContain('halloween')
  })
})

describe('listCategories', () => {
  it('counts word bank entries for the categories it covers', () => {
    const t = ((k: string) => k) as never
    const counts = new Map(listCategories([], t).map((c) => [c.id, c.pairCount]))
    expect(counts.get('food')).toBe(40)
    expect(counts.get('places')).toBe(40)
    expect(counts.get('tricky')).toBeGreaterThan(0)
  })
})

describe('hintExample', () => {
  it('gives the word and a distinct hint per level', () => {
    const ex = hintExample()
    expect(ex.word).toBe('Bakery')
    expect(ex.hints.none).toBeNull()
    const shown = [ex.word, ex.hints.word, ex.hints.close, ex.hints.category]
    expect(new Set(shown).size).toBe(4)
  })
})
