import type { CardState, CardLevelEvent } from 'core/domain/card'
import type { Battle, SyncSnapshot } from 'core/domain/player'

export interface Settings {
  playerTag: string | null
  activeGoalId: string | null
}

export interface Repository {
  getSettings(): Promise<Settings>
  saveSettings(patch: Partial<Settings>): Promise<void>
  getCardState(): Promise<CardState[]>
  putCardState(cards: CardState[]): Promise<void>
  appendCardLevelEvents(events: CardLevelEvent[]): Promise<void>
  getCardLevelEvents(): Promise<CardLevelEvent[]>
  addSync(snapshot: SyncSnapshot): Promise<void>
  getSyncs(): Promise<SyncSnapshot[]>
  upsertBattles(battles: Battle[]): Promise<number>
  getBattles(): Promise<Battle[]>
}

export const DEFAULT_SETTINGS: Settings = { playerTag: null, activeGoalId: null }
