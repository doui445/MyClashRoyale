import type { CardState, CardLevelEvent } from 'core/domain/card'
import type { Battle, SyncSnapshot } from 'core/domain/player'
import { DEFAULT_SETTINGS, type Repository, type Settings } from './repository'

export class MemoryRepository implements Repository {
  private settings: Settings = { ...DEFAULT_SETTINGS }
  private cards: CardState[] = []
  private events: CardLevelEvent[] = []
  private syncs: SyncSnapshot[] = []
  private battles = new Map<string, Battle>()

  async getSettings() { return { ...this.settings } }
  async saveSettings(patch: Partial<Settings>) { this.settings = { ...this.settings, ...patch } }
  async getCardState() { return this.cards.map((c) => ({ ...c })) }
  async putCardState(cards: CardState[]) { this.cards = cards.map((c) => ({ ...c })) }
  async appendCardLevelEvents(events: CardLevelEvent[]) { this.events.push(...events) }
  async getCardLevelEvents() { return this.events.map((e) => ({ ...e })) }
  async addSync(s: SyncSnapshot) { this.syncs.push({ ...s }) }
  async getSyncs() { return this.syncs.map((s) => ({ ...s })) }
  async upsertBattles(battles: Battle[]) {
    let added = 0
    for (const b of battles) {
      if (!this.battles.has(b.id)) added++
      this.battles.set(b.id, { ...b })
    }
    return added
  }
  async getBattles() { return [...this.battles.values()] }
}
