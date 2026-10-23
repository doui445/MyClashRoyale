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
  /**
   * Formes spéciales débloquées, `evolutionLevel` brut de l'API : code additif
   * 1 = évolution, 2 = héros, 3 = les deux, 0 = aucune. Lire via hasEvo/hasHero.
   */
  evoLevel: number
}

const EVO_BIT = 1
const HERO_BIT = 2

export function hasEvo(card: Pick<CardState, 'evoLevel'>): boolean {
  return (card.evoLevel & EVO_BIT) !== 0
}

export function hasHero(card: Pick<CardState, 'evoLevel'>): boolean {
  return (card.evoLevel & HERO_BIT) !== 0
}

export interface CardLevelEvent {
  cardId: string
  at: string
  fromLevel: number
  toLevel: number
  fromCount: number
  toCount: number
}
