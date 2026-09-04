import { describe, it, expect } from 'vitest'
import { syncPlayer } from './sync-player'
import { MemoryRepository } from 'storage/memory-repository'
import type { ClashApiClient } from 'core/clash-api/client'
import type { PlayerProfile, Battle } from 'core/domain/player'

const profile = (over: Partial<PlayerProfile> = {}): PlayerProfile => ({
  tag: '#ABC', name: 'Test', trophies: 5000, bestTrophies: 5200, kingLevel: 14, arena: 'Arène 23',
  cards: [
    { cardId: 'hog-rider', name: 'Hog Rider', level: 11, maxLevel: 14, count: 0, rarity: 'rare', elixir: 4, evoLevel: 0 },
  ],
  ...over,
})

const fakeApi = (p: PlayerProfile, battles: Battle[] = []): ClashApiClient => ({
  getPlayer: async () => p,
  getBattlelog: async () => battles,
})

const deps = (api: ClashApiClient) => ({ repo: new MemoryRepository(), api, now: () => '2026-09-03T12:00:00.000Z' })

describe('syncPlayer', () => {
  it('premier sync : cardState créé, AUCUN event, snapshot enregistré', async () => {
    const d = deps(fakeApi(profile()))
    const res = await syncPlayer('#ABC', d)
    expect(await d.repo.getCardState()).toHaveLength(1)
    expect(await d.repo.getCardLevelEvents()).toHaveLength(0)
    expect(await d.repo.getSyncs()).toHaveLength(1)
    expect(res.newEvents).toBe(0)
    expect(res.trophyDelta).toBeNull()
  })

  it('deuxième sync avec montée de niveau : un event, trophyDelta calculé', async () => {
    const d = deps(fakeApi(profile()))
    await syncPlayer('#ABC', d)
    d.api.getPlayer = async () => profile({
      trophies: 5100,
      cards: [{ cardId: 'hog-rider', name: 'Hog Rider', level: 12, maxLevel: 14, count: 0, rarity: 'rare', elixir: 4, evoLevel: 0 }],
    })
    const res = await syncPlayer('#ABC', d)
    expect(res.newEvents).toBe(1)
    expect(res.trophyDelta).toBe(100)
    expect(await d.repo.getCardLevelEvents()).toHaveLength(1)
  })

  it('enregistre le tag dans les settings et déduplique les combats', async () => {
    const battle: Battle = {
      id: 'b1', at: '2026-09-03T11:00:00.000Z', mode: 'Ladder', result: 'win',
      crownsFor: 3, crownsAgainst: 1, trophyChange: 30, myDeck: [], oppDeck: [],
    }
    const d = deps(fakeApi(profile(), [battle]))
    const first = await syncPlayer('#ABC', d)
    expect(first.newBattles).toBe(1)
    expect((await d.repo.getSettings()).playerTag).toBe('#ABC')
    const second = await syncPlayer('#ABC', d)
    expect(second.newBattles).toBe(0)
  })
})
