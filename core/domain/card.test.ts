import { describe, it, expectTypeOf } from 'vitest'
import type { CardState, CardLevelEvent, Rarity } from './card'

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
