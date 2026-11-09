import { describe, expect, it } from 'vitest'
import type { Pair } from '../game/types'
import { privateCards } from './deal'

const pair: Pair = { civilian: 'Bakery', spy: 'Bread', categoryId: 'places', hintLevel: 'close' }
const names = { a: 'Ann', b: 'Ben', c: 'Cat', d: 'Dan' }
const off = { spiesKnowEachOther: false, civiliansSeeHint: false, unawareSpy: false }

describe('privateCards', () => {
  it('gives civilians the word and spies the hint', () => {
    const cards = privateCards(pair, ['a', 'b', 'c'], ['b'], names, off)
    expect(cards).toEqual({
      a: { word: 'Bakery', isSpy: false },
      b: { word: 'Bread', isSpy: true },
      c: { word: 'Bakery', isSpy: false },
    })
  })

  it('shows civilians the spy hint only when that is on', () => {
    const cards = privateCards(pair, ['a', 'b', 'c'], ['b'], names, { ...off, civiliansSeeHint: true })
    expect(cards.a.spyHint).toBe('Bread')
    expect(cards.c.spyHint).toBe('Bread')
    expect(cards.b.spyHint).toBeUndefined()
  })

  it('shows civilians nothing extra when the spy has no hint', () => {
    const cards = privateCards({ ...pair, spy: '', hintLevel: 'none' }, ['a', 'b', 'c'], ['b'], names, {
      ...off,
      civiliansSeeHint: true,
    })
    expect(cards.a).toEqual({ word: 'Bakery', isSpy: false })
  })

  it('tells spies about each other independently of the hint setting', () => {
    const cards = privateCards(pair, ['a', 'b', 'c', 'd'], ['b', 'd'], names, {
      spiesKnowEachOther: true,
      civiliansSeeHint: false,
      unawareSpy: false,
    })
    expect(cards.b.fellowSpyNames).toEqual(['Dan'])
    expect(cards.d.fellowSpyNames).toEqual(['Ben'])
    expect(cards.a.fellowSpyNames).toBeUndefined()
    expect(cards.a.spyHint).toBeUndefined()
  })
})

describe('privateCards with an unaware spy', () => {
  it('hides every role and the spy list, and stores no spy flag', () => {
    const cards = privateCards(pair, ['a', 'b', 'c', 'd'], ['b', 'd'], names, {
      spiesKnowEachOther: true,
      civiliansSeeHint: true,
      unawareSpy: true,
    })
    expect(cards.b).toEqual({ word: 'Bread', isSpy: false, unaware: true })
    expect(cards.a).toEqual({ word: 'Bakery', isSpy: false, unaware: true })
  })
})
