import { describe, expect, it } from 'vitest'
import {
  WORD_LANGS,
  WORD_META,
  sharesRoot,
  validateWordBank,
  wordEntries,
  type WordLangFile,
  type WordMetaFile,
} from './words'

describe('sharesRoot', () => {
  it.each([
    ['Lemon', 'Lemonade'],
    ['Corn', 'Popcorn'],
    ['Hot dog', 'Corn dog'],
    ['Library', 'Librarian'],
    ['Café', 'Cafe'],
    ['Bäckerei', 'Backerei'],
  ])('flags %s / %s', (w, h) => expect(sharesRoot(w, h)).toBe(true))

  it.each([
    ['Bakery', 'Bread'],
    ['Tea', 'Tears'],
    ['Spaghetti', 'Spain'],
    ['Salon de coiffure', 'Salle de sport'],
    ['Die Bäckerei', 'Der Metzger'],
  ])('allows %s / %s', (w, h) => expect(sharesRoot(w, h)).toBe(false))
})

describe('validateWordBank', () => {
  const meta: WordMetaFile = {
    subs: { food: ['fruit'] },
    entries: [{ id: 'lemon', category: 'food', sub: 'fruit', difficulty: 1 }],
  }
  const good: WordLangFile = {
    subs: { fruit: 'Fruit' },
    entries: { lemon: { word: 'Lemon', associated: ['Sour', 'Tea'], sibling: ['Lime', 'Orange'] } },
  }

  it('accepts a valid file', () => {
    expect(validateWordBank(meta, 'en', good)).toEqual([])
  })

  it('reports each broken rule', () => {
    const bad: WordLangFile = {
      subs: {},
      entries: {
        lemon: { word: 'Lemon', associated: ['Lemonade', 'Sour'], sibling: ['sour'] },
        extra: { word: 'X', associated: [], sibling: [] },
      },
    }
    const issues = validateWordBank(
      { ...meta, entries: [...meta.entries, { id: 'lime', category: 'food', sub: 'citrus', difficulty: 1 }] },
      'en',
      bad,
    )
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('sub "citrus" not listed'),
        expect.stringContaining('sub:fruit: missing label'),
        expect.stringContaining('extra: not in meta'),
        expect.stringContaining('lime: missing'),
        expect.stringContaining('"Lemonade" gives away'),
        expect.stringContaining('sibling: needs 2+'),
        expect.stringContaining('duplicate hint "sour"'),
      ]),
    )
  })
})

describe('shipped word bank', () => {
  it.each(Object.keys(WORD_LANGS))('%s passes every rule', (lang) => {
    expect(validateWordBank(WORD_META, lang, WORD_LANGS[lang])).toEqual([])
  })

  it('has 40 entries for food and places', () => {
    for (const cat of ['food', 'places']) {
      expect(WORD_META.entries.filter((e) => e.category === cat)).toHaveLength(40)
    }
  })

  it('merges meta and text', () => {
    const bakery = wordEntries('en').find((e) => e.id === 'bakery')
    expect(bakery).toMatchObject({ word: 'Bakery', category: 'places', subName: 'Shop' })
  })
})
