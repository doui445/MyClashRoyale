import type { CardState, CardLevelEvent } from 'core/domain/card'
import type { Battle, SyncSnapshot } from 'core/domain/player'
import { DEFAULT_SETTINGS, type Repository, type Settings } from '../repository'
import type { MyCrDb } from './db'

export class DexieRepository implements Repository {
  constructor(private db: MyCrDb) {}

  async getSettings(): Promise<Settings> {
    const row = await this.db.settings.get('singleton')
    if (!row) return { ...DEFAULT_SETTINGS }
    return { playerTag: row.playerTag, activeGoalId: row.activeGoalId }
  }

  async saveSettings(patch: Partial<Settings>): Promise<void> {
    const current = await this.getSettings()
    const next = { ...current, ...patch }
    await this.db.settings.put({ key: 'singleton', ...next })
  }

  async getCardState(): Promise<CardState[]> {
    return this.db.cardState.toArray()
  }

  async putCardState(cards: CardState[]): Promise<void> {
    await this.db.transaction('rw', this.db.cardState, async () => {
      await this.db.cardState.clear()
      await this.db.cardState.bulkAdd(cards)
    })
  }

  async appendCardLevelEvents(events: CardLevelEvent[]): Promise<void> {
    if (events.length) await this.db.cardLevelEvents.bulkAdd(events)
  }

  async getCardLevelEvents(): Promise<CardLevelEvent[]> {
    const rows = await this.db.cardLevelEvents.orderBy('id').toArray()
    return rows.map(({ id: _id, ...e }) => e)
  }

  async addSync(snapshot: SyncSnapshot): Promise<void> {
    await this.db.syncs.add(snapshot)
  }

  async getSyncs(): Promise<SyncSnapshot[]> {
    const rows = await this.db.syncs.orderBy('id').toArray()
    return rows.map(({ id: _id, ...s }) => s)
  }

  async upsertBattles(battles: Battle[]): Promise<number> {
    const ids = battles.map((b) => b.id)
    const existing = new Set((await this.db.battles.bulkGet(ids)).filter(Boolean).map((b) => b!.id))
    await this.db.battles.bulkPut(battles)
    return battles.filter((b) => !existing.has(b.id)).length
  }

  async getBattles(): Promise<Battle[]> {
    return this.db.battles.orderBy('at').toArray()
  }
}
