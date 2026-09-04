import { describe, it, expect } from 'vitest'
import { diffCardStates } from './diff'
import type { CardState } from 'core/domain/card'

const card = (over: Partial<CardState>): CardState => ({
  cardId: 'hog-rider', name: 'Hog Rider', level: 10, maxLevel: 14,
  count: 0, rarity: 'rare', elixir: 4, evoLevel: 0, ...over,
})
const AT = '2026-09-03T00:00:00.000Z'

describe('diffCardStates', () => {
  it('aucun changement => aucun event', () => {
    expect(diffCardStates([card({})], [card({})], AT)).toEqual([])
  })
  it('montée de niveau => un event', () => {
    const events = diffCardStates([card({ level: 10 })], [card({ level: 11 })], AT)
    expect(events).toEqual([
      { cardId: 'hog-rider', at: AT, fromLevel: 10, toLevel: 11, fromCount: 0, toCount: 0 },
    ])
  })
  it('changement de nombre de copies seul => un event', () => {
    const events = diffCardStates([card({ count: 5 })], [card({ count: 20 })], AT)
    expect(events[0]).toMatchObject({ fromCount: 5, toCount: 20, fromLevel: 10, toLevel: 10 })
  })
  it('nouvelle carte débloquée => event depuis 0', () => {
    const events = diffCardStates([], [card({ cardId: 'the-log', level: 9 })], AT)
    expect(events[0]).toMatchObject({ cardId: 'the-log', fromLevel: 0, toLevel: 9 })
  })
})
