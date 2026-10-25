import { describe, expect, it, vi } from 'vitest'

vi.mock('../i18n', () => ({ default: { language: 'en', t: (k: string) => k } }))

const { hintExample, samplePair } = await import('./pairs')
await (await import('../data/pairStore')).loadPairs('en')

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

describe('samplePair', () => {
  it('hard: returns the curated pair', () => {
    for (let i = 0; i < 50; i++) {
      const p = samplePair(onlyCustom, [list], 'hard')
      expect([['Cat', 'Lynx'], ['Dog', 'Wolf']]).toContainEqual([p.civilian, p.spy])
    }
  })
  it('medium: spy gets a different civilian word from the same category', () => {
    for (let i = 0; i < 50; i++) {
      const p = samplePair(onlyCustom, [list], 'medium')
      expect(p.spy).not.toBe(p.civilian)
      expect(['Cat', 'Dog']).toContain(p.spy)
    }
  })
  it('easy: spy gets no word', () => {
    expect(samplePair(onlyCustom, [list], 'easy').spy).toBe('')
  })
  it('throws when nothing is selected', () => {
    expect(() => samplePair({ selectedCategoryIds: [] }, [list])).toThrow()
  })
  it('only draws from selected built-in categories', () => {
    for (let i = 0; i < 50; i++) {
      expect(samplePair({ selectedCategoryIds: ['animals'] }, []).categoryId).toBe('animals')
    }
  })
})

describe('hintExample', () => {
  it('gives three distinct words', () => {
    const ex = hintExample()
    expect(new Set([ex.word, ex.hard, ex.medium]).size).toBe(3)
  })
})
