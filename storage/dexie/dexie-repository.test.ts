import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DexieRepository } from './dexie-repository'
import { createDb } from './db'
import type { MyCrDb } from './db'

let db: MyCrDb
let repo: DexieRepository

beforeEach(async () => {
  db = createDb()
  await db.delete()
  await db.open()
  repo = new DexieRepository(db)
})

afterEach(() => db.close())

describe('DexieRepository', () => {
  it('persiste et relit les settings', async () => {
    await repo.saveSettings({ playerTag: '#ABC' })
    expect((await repo.getSettings()).playerTag).toBe('#ABC')
  })

  it('putCardState remplace tout le contenu', async () => {
    await repo.putCardState([
      { cardId: 'a', name: 'A', level: 1, maxLevel: 14, count: 0, rarity: 'common', elixir: 3, evoLevel: 0 },
      { cardId: 'b', name: 'B', level: 1, maxLevel: 14, count: 0, rarity: 'common', elixir: 3, evoLevel: 0 },
    ])
    await repo.putCardState([
      { cardId: 'c', name: 'C', level: 1, maxLevel: 14, count: 0, rarity: 'common', elixir: 3, evoLevel: 0 },
    ])
    expect(await repo.getCardState()).toHaveLength(1)
  })

  it('upsertBattles déduplique entre deux appels', async () => {
    const b = (id: string) => ({
      id, at: 't', mode: 'L', result: 'win' as const,
      crownsFor: 1, crownsAgainst: 0, trophyChange: 1, myDeck: [], oppDeck: [],
    })
    expect(await repo.upsertBattles([b('a')])).toBe(1)
    expect(await repo.upsertBattles([b('a'), b('b')])).toBe(1)
    expect(await repo.getBattles()).toHaveLength(2)
  })
})
