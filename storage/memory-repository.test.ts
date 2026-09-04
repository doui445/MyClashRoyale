import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRepository } from './memory-repository'
import type { Repository } from './repository'

let repo: Repository

beforeEach(() => { repo = new MemoryRepository() })

describe('MemoryRepository', () => {
  it('settings : défaut vide puis persistance partielle', async () => {
    expect(await repo.getSettings()).toEqual({ playerTag: null, activeGoalId: null })
    await repo.saveSettings({ playerTag: '#ABC123' })
    expect((await repo.getSettings()).playerTag).toBe('#ABC123')
  })

  it('putCardState remplace tout', async () => {
    await repo.putCardState([
      { cardId: 'hog-rider', name: 'Hog Rider', level: 11, maxLevel: 14, count: 0, rarity: 'rare', elixir: 4, evoLevel: 0 },
    ])
    await repo.putCardState([
      { cardId: 'the-log', name: 'The Log', level: 5, maxLevel: 6, count: 0, rarity: 'legendary', elixir: 2, evoLevel: 0 },
    ])
    const cards = await repo.getCardState()
    expect(cards).toHaveLength(1)
    expect(cards[0].cardId).toBe('the-log')
  })

  it('appendCardLevelEvents accumule', async () => {
    await repo.appendCardLevelEvents([
      { cardId: 'hog-rider', at: 't1', fromLevel: 10, toLevel: 11, fromCount: 0, toCount: 0 },
    ])
    await repo.appendCardLevelEvents([
      { cardId: 'the-log', at: 't2', fromLevel: 4, toLevel: 5, fromCount: 0, toCount: 0 },
    ])
    expect(await repo.getCardLevelEvents()).toHaveLength(2)
  })

  it('upsertBattles déduplique par id et compte les nouveaux', async () => {
    const b = (id: string) => ({
      id, at: 't', mode: 'Ladder', result: 'win' as const,
      crownsFor: 3, crownsAgainst: 0, trophyChange: 30, myDeck: [], oppDeck: [],
    })
    expect(await repo.upsertBattles([b('a'), b('b')])).toBe(2)
    expect(await repo.upsertBattles([b('b'), b('c')])).toBe(1)
    expect(await repo.getBattles()).toHaveLength(3)
  })
})
