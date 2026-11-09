import { describe, expect, it } from 'vitest'
import { cardRules, dealCard } from './cards'
import type { Pair } from './types'

const pair: Pair = { civilian: 'Bakery', spy: 'Butcher', categoryId: 'places', hintLevel: 'word' }
const all = { unawareSpy: true, spiesKnowEachOther: true, civiliansSeeHint: true }
const off = { unawareSpy: false, spiesKnowEachOther: false, civiliansSeeHint: false }

describe('cardRules', () => {
  it('keeps the spy unaware only with hints that read like a real word', () => {
    expect(cardRules(all, 'word').unawareSpy).toBe(true)
    expect(cardRules(all, 'close').unawareSpy).toBe(true)
    expect(cardRules(all, 'category').unawareSpy).toBe(false)
    expect(cardRules(all, 'none').unawareSpy).toBe(false)
  })

  it('turns off the extras that would tell an unaware spy their role', () => {
    expect(cardRules(all, 'word')).toEqual({
      unawareSpy: true,
      spiesKnowEachOther: false,
      civiliansSeeHint: false,
    })
  })

  it('leaves the extras alone when the spy cannot be unaware', () => {
    expect(cardRules(all, 'category')).toEqual({
      unawareSpy: false,
      spiesKnowEachOther: true,
      civiliansSeeHint: true,
    })
    expect(cardRules(all, 'none').civiliansSeeHint).toBe(false)
  })
})

describe('dealCard', () => {
  it('gives an unaware spy their word on a card that looks like everyone else’s', () => {
    const spy = dealCard(pair, true, ['Dan'], all)
    const civ = dealCard(pair, false, [], all)
    expect(spy).toEqual({ word: 'Butcher', isSpy: false, unaware: true })
    expect(civ).toEqual({ word: 'Bakery', isSpy: false, unaware: true })
  })

  it('tells the spy their role when the round’s hint level cannot hide it', () => {
    const spy = dealCard({ ...pair, spy: 'Shop', hintLevel: 'category' }, true, [], {
      ...off,
      unawareSpy: true,
    })
    expect(spy).toEqual({ word: 'Shop', isSpy: true })
  })

  it('treats rounds without a hint level as decoy-word rounds', () => {
    const old: Pair = { civilian: 'Bakery', spy: 'Butcher', categoryId: 'places' }
    expect(dealCard(old, true, [], { ...off, unawareSpy: true }).isSpy).toBe(false)
  })

  it('deals normal cards with the setting off', () => {
    expect(dealCard(pair, true, ['Dan', ''], { ...off, spiesKnowEachOther: true })).toEqual({
      word: 'Butcher',
      isSpy: true,
      fellowSpyNames: ['Dan'],
    })
  })
})
