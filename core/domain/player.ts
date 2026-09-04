import type { CardState } from './card'

export interface PlayerProfile {
  tag: string
  name: string
  trophies: number
  bestTrophies: number
  kingLevel: number
  arena: string
  cards: CardState[]
}

export interface Battle {
  id: string
  at: string
  mode: string
  result: 'win' | 'loss' | 'draw'
  crownsFor: number
  crownsAgainst: number
  trophyChange: number
  myDeck: string[]
  oppDeck: string[]
}

export interface SyncSnapshot {
  at: string
  trophies: number
  kingLevel: number
  arena: string
}
