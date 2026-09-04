import type { Repository } from 'storage/repository'
import type { ClashApiClient } from 'core/clash-api/client'
import { diffCardStates } from './diff'

export interface SyncDeps {
  repo: Repository
  api: ClashApiClient
  now(): string
}

export interface SyncResult {
  newEvents: number
  trophyDelta: number | null
  newBattles: number
}

export async function syncPlayer(tag: string, deps: SyncDeps): Promise<SyncResult> {
  const { repo, api, now } = deps
  const at = now()

  const [profile, battles] = await Promise.all([api.getPlayer(tag), api.getBattlelog(tag)])

  const previousCards = await repo.getCardState()
  const previousSyncs = await repo.getSyncs()
  const isFirstSync = previousCards.length === 0

  const events = isFirstSync ? [] : diffCardStates(previousCards, profile.cards, at)

  await repo.appendCardLevelEvents(events)
  await repo.putCardState(profile.cards)
  await repo.addSync({ at, trophies: profile.trophies, kingLevel: profile.kingLevel, arena: profile.arena })
  const newBattles = await repo.upsertBattles(battles)
  await repo.saveSettings({ playerTag: profile.tag })

  const lastTrophies = previousSyncs.at(-1)?.trophies ?? null
  const trophyDelta = lastTrophies === null ? null : profile.trophies - lastTrophies

  return { newEvents: events.length, trophyDelta, newBattles }
}
