export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'champion'

export interface CardState {
  cardId: string
  name: string
  /** Niveau "joueur" normalisé (1..maxLevel du jeu), voir normalizeCardLevel. */
  level: number
  maxLevel: number
  /** Copies en trop (au-delà de ce qu'il faut pour le niveau actuel). */
  count: number
  rarity: Rarity
  elixir: number
  /** Niveau d'évolution possédé (0 si aucune). */
  evoLevel: number
}

export interface CardLevelEvent {
  cardId: string
  at: string
  fromLevel: number
  toLevel: number
  fromCount: number
  toCount: number
}
