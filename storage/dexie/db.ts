import Dexie, { type Table } from 'dexie'
import type { CardState, CardLevelEvent } from 'core/domain/card'
import type { Battle, SyncSnapshot } from 'core/domain/player'

export interface SettingsRow { key: 'singleton'; playerTag: string | null; activeGoalId: string | null }
export interface SyncRow extends SyncSnapshot { id?: number }
export interface EventRow extends CardLevelEvent { id?: number }

export class MyCrDb extends Dexie {
  settings!: Table<SettingsRow, string>
  cardState!: Table<CardState, string>
  cardLevelEvents!: Table<EventRow, number>
  syncs!: Table<SyncRow, number>
  battles!: Table<Battle, string>

  constructor() {
    super('mycr')
    this.version(1).stores({
      settings: 'key',
      cardState: 'cardId',
      cardLevelEvents: '++id, cardId, at',
      syncs: '++id, at',
      battles: 'id, at',
    })
  }
}

export function createDb(): MyCrDb {
  return new MyCrDb()
}
