import { describe, it, expect } from 'vitest'
import { createClashApiClient } from './client'
import { ClashApiError } from './errors'
import playerFixture from './__fixtures__/player.json'
import battlelogFixture from './__fixtures__/battlelog.json'

function fakeFetch(status: number, body: unknown) {
  return async () =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

describe('ClashApiClient.getPlayer', () => {
  it('mappe la réponse brute vers PlayerProfile', async () => {
    const client = createClashApiClient('https://app.test/api', fakeFetch(200, playerFixture))
    const p = await client.getPlayer('#2ABCDEF')

    expect(p.tag).toBe(playerFixture.tag)
    expect(p.name).toBe(playerFixture.name)
    expect(p.trophies).toBe(playerFixture.trophies)
    expect(p.bestTrophies).toBe(playerFixture.bestTrophies)
    expect(p.kingLevel).toBe(playerFixture.expLevel)
    expect(p.arena).toBe(playerFixture.arena.name)
    expect(p.cards.length).toBe(playerFixture.cards.length)

    const c = p.cards[0]
    expect(typeof c.cardId).toBe('string')
    expect(c.cardId).toMatch(/^[a-z0-9-]+$/)
    expect(c.level).toBeGreaterThan(0)
  })

  it('mappe chaque carte (id, niveau normalisé, rareté déclarée) correctement', () => {
    return createClashApiClient('https://app.test/api', fakeFetch(200, playerFixture))
      .getPlayer('#2ABCDEF')
      .then((p) => {
        const knight = p.cards.find((c) => c.cardId === 'knight')
        expect(knight).toMatchObject({
          name: 'Knight',
          level: 11, // normalizeCardLevel(11, 14) = 11
          maxLevel: 14,
          count: 140,
          rarity: 'common',
          elixir: 3,
          evoLevel: 1,
        })

        const log = p.cards.find((c) => c.cardId === 'the-log')
        expect(log).toMatchObject({
          name: 'The Log',
          level: 9, // normalizeCardLevel(1, 6) = 9
          maxLevel: 6,
          rarity: 'legendary',
          evoLevel: 0, // pas d'evolutionLevel dans la fixture => 0 par défaut
        })

        const goldenKnight = p.cards.find((c) => c.cardId === 'golden-knight')
        expect(goldenKnight).toMatchObject({
          level: 11, // normalizeCardLevel(1, 4) = 11
          rarity: 'champion',
        })
      })
  })

  it('déduit la rareté depuis maxLevel quand `rarity` est absent de la fixture', async () => {
    const noRarity = {
      ...playerFixture,
      cards: [{ name: 'Mystery Card', level: 1, maxLevel: 9, count: 1 }],
    }
    const client = createClashApiClient('https://app.test/api', fakeFetch(200, noRarity))
    const p = await client.getPlayer('#2ABCDEF')
    expect(p.cards[0].rarity).toBe('epic')
  })

  it('mappe { error: "NOT_FOUND" } en ClashApiError', async () => {
    const client = createClashApiClient('https://app.test/api', fakeFetch(404, { error: 'NOT_FOUND' }))
    await expect(client.getPlayer('#NOPE')).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(client.getPlayer('#NOPE')).rejects.toBeInstanceOf(ClashApiError)
  })

  it('mappe { error: "RATE_LIMITED" } en ClashApiError', async () => {
    const client = createClashApiClient('https://app.test/api', fakeFetch(429, { error: 'RATE_LIMITED' }))
    await expect(client.getPlayer('#X')).rejects.toMatchObject({ code: 'RATE_LIMITED' })
  })

  it('mappe { error: "MAINTENANCE" } en ClashApiError', async () => {
    const client = createClashApiClient('https://app.test/api', fakeFetch(503, { error: 'MAINTENANCE' }))
    await expect(client.getPlayer('#X')).rejects.toMatchObject({ code: 'MAINTENANCE' })
  })

  it('mappe une erreur non reconnue en ClashApiError UNKNOWN', async () => {
    const client = createClashApiClient('https://app.test/api', fakeFetch(502, { error: 'UPSTREAM_ERROR' }))
    await expect(client.getPlayer('#X')).rejects.toMatchObject({ code: 'UNKNOWN' })
  })

  it('transforme une panne réseau en ClashApiError OFFLINE', async () => {
    const client = createClashApiClient('https://app.test/api', async () => {
      throw new TypeError('network')
    })
    await expect(client.getPlayer('#X')).rejects.toMatchObject({ code: 'OFFLINE' })
  })
})

describe('ClashApiClient.getBattlelog', () => {
  it('mappe le tableau brut vers Battle[]', async () => {
    const client = createClashApiClient('https://app.test/api', fakeFetch(200, battlelogFixture))
    const battles = await client.getBattlelog('#2ABCDEF')

    expect(battles.length).toBe(battlelogFixture.length)

    const [win, loss] = battles
    expect(win.result).toBe('win')
    expect(win.crownsFor).toBe(3)
    expect(win.crownsAgainst).toBe(1)
    expect(win.trophyChange).toBe(30)
    expect(win.mode).toBe('Ladder')
    expect(win.myDeck).toContain('hog-rider')
    expect(win.oppDeck).toContain('musketeer')
    expect(typeof win.id).toBe('string')

    expect(loss.result).toBe('loss')
    expect(loss.crownsFor).toBe(0)
    expect(loss.crownsAgainst).toBe(2)
  })

  it('transforme une panne réseau en ClashApiError OFFLINE', async () => {
    const client = createClashApiClient('https://app.test/api', async () => {
      throw new TypeError('network')
    })
    await expect(client.getBattlelog('#X')).rejects.toMatchObject({ code: 'OFFLINE' })
  })
})
