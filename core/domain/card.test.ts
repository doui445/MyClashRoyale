import { describe, it, expect, expectTypeOf } from 'vitest'
import { hasEvo, hasHero, type CardState, type CardLevelEvent, type Rarity } from './card'

describe('types de carte', () => {
  it('CardState a la forme attendue', () => {
    const c: CardState = {
      cardId: 'hog-rider', name: 'Hog Rider', level: 11, maxLevel: 14,
      count: 0, rarity: 'rare', elixir: 4, evoLevel: 0,
    }
    expectTypeOf(c.rarity).toEqualTypeOf<Rarity>()
  })
  it('CardLevelEvent a la forme attendue', () => {
    const e: CardLevelEvent = {
      cardId: 'hog-rider', at: '2026-09-03T10:00:00.000Z',
      fromLevel: 10, toLevel: 11, fromCount: 5, toCount: 0,
    }
    expectTypeOf(e.at).toBeString()
  })
})

describe('hasEvo / hasHero (code additif 1 = évolution, 2 = héros)', () => {
  const cases: Array<[number, boolean, boolean]> = [
    [0, false, false],
    [1, true, false],
    [2, false, true],
    [3, true, true],
  ]
  it.each(cases)('evoLevel %i => évo %s, héros %s', (evoLevel, evo, hero) => {
    expect(hasEvo({ evoLevel })).toBe(evo)
    expect(hasHero({ evoLevel })).toBe(hero)
  })
})
