import type { PlayerProfile, Battle } from 'core/domain/player'
import type { CardState, Rarity } from 'core/domain/card'
import { toCardSlug } from 'core/domain/ids'
import { normalizeCardLevel, GAME_MAX } from './normalize'
import { ClashApiError, type ClashApiErrorCode } from './errors'
import type { RawPlayer, RawCard, RawBattle } from './types'

export interface ClashApiClient {
  getPlayer(tag: string): Promise<PlayerProfile>
  getBattlelog(tag: string): Promise<Battle[]>
}

type FetchImpl = typeof fetch

const RARITY: Record<string, Rarity> = {
  common: 'common',
  rare: 'rare',
  epic: 'epic',
  legendary: 'legendary',
  champion: 'champion',
}

const KNOWN_ERROR_CODES: readonly ClashApiErrorCode[] = ['NOT_FOUND', 'RATE_LIMITED', 'MAINTENANCE']

function isKnownErrorCode(code: string | undefined): code is ClashApiErrorCode {
  return KNOWN_ERROR_CODES.some((known) => known === code)
}

function rarityFromMaxLevel(maxLevel: number): Rarity {
  // Repli si l'API ne fournit pas `rarity` sur la carte. Bornes observées sur
  // l'API réelle (2026-10-23) : commune 16, rare 14, épique 11, légendaire 8,
  // champion 6.
  if (maxLevel >= 16) return 'common'
  if (maxLevel >= 14) return 'rare'
  if (maxLevel >= 11) return 'epic'
  if (maxLevel >= 8) return 'legendary'
  return 'champion'
}

function mapCard(raw: RawCard): CardState {
  const rarity = raw.rarity ? (RARITY[raw.rarity.toLowerCase()] ?? rarityFromMaxLevel(raw.maxLevel)) : rarityFromMaxLevel(raw.maxLevel)
  return {
    cardId: toCardSlug(raw.name),
    name: raw.name,
    level: normalizeCardLevel(raw.level, raw.maxLevel),
    maxLevel: GAME_MAX,
    count: raw.count ?? 0,
    rarity,
    elixir: raw.elixirCost ?? 0,
    evoLevel: raw.evolutionLevel ?? 0,
  }
}

function battleId(b: RawBattle): string {
  const opp = b.opponent[0]?.tag ?? 'unknown'
  return `${b.battleTime}:${opp}`
}

function mapBattle(b: RawBattle): Battle {
  const me = b.team[0]
  const opp = b.opponent[0]
  const crownsFor = me?.crowns ?? 0
  const crownsAgainst = opp?.crowns ?? 0
  return {
    id: battleId(b),
    at: b.battleTime,
    mode: b.gameMode?.name ?? b.type,
    result: crownsFor > crownsAgainst ? 'win' : crownsFor < crownsAgainst ? 'loss' : 'draw',
    crownsFor,
    crownsAgainst,
    trophyChange: me?.trophyChange ?? 0,
    myDeck: (me?.cards ?? []).map((c) => toCardSlug(c.name)),
    oppDeck: (opp?.cards ?? []).map((c) => toCardSlug(c.name)),
  }
}

async function call<T>(url: string, fetchImpl: FetchImpl): Promise<T> {
  let res: Response
  try {
    res = await fetchImpl(url)
  } catch {
    throw new ClashApiError('OFFLINE')
  }
  if (!res.ok) {
    let code: ClashApiErrorCode = 'UNKNOWN'
    try {
      const body = (await res.json()) as { error?: string }
      if (isKnownErrorCode(body.error)) {
        code = body.error
      }
    } catch {
      /* garde UNKNOWN */
    }
    throw new ClashApiError(code)
  }
  try {
    return (await res.json()) as T
  } catch {
    throw new ClashApiError('UNKNOWN')
  }
}

export function createClashApiClient(baseUrl: string, fetchImpl: FetchImpl = fetch): ClashApiClient {
  const enc = (tag: string) => encodeURIComponent(tag.replace(/^#/, '').toUpperCase())
  return {
    async getPlayer(tag) {
      const raw = await call<RawPlayer>(`${baseUrl}/player/${enc(tag)}`, fetchImpl)
      return {
        tag: raw.tag,
        name: raw.name,
        trophies: raw.trophies,
        bestTrophies: raw.bestTrophies,
        kingLevel: raw.expLevel,
        arena: raw.arena?.name ?? '',
        cards: raw.cards.map(mapCard),
      }
    },
    async getBattlelog(tag) {
      const raw = await call<RawBattle[]>(`${baseUrl}/player/${enc(tag)}/battles`, fetchImpl)
      return raw.map(mapBattle)
    },
  }
}
