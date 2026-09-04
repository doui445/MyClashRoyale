// Formes brutes telles que renvoyées par notre relais Cloudflare
// (functions/api/player/[tag] et .../battles), qui repasse tel quel le JSON
// de l'API officielle Clash Royale (via proxy.royaleapi.com).
//
// NOTE : ces interfaces ont été construites à partir de la documentation
// publique et de wrappers communautaires (aucune fixture réelle capturée —
// pas de CLASH_API_TOKEN disponible dans cet environnement). Champs
// optionnels marqués `?` par prudence là où la présence dans la réponse
// réelle n'a pas pu être vérifiée. À confirmer/ajuster dès qu'une clé API de
// dev existe.

export interface RawCard {
  name: string
  level: number
  maxLevel: number
  count?: number
  elixirCost?: number
  evolutionLevel?: number
  starLevel?: number
  rarity?: string
}

export interface RawPlayer {
  tag: string
  name: string
  trophies: number
  bestTrophies: number
  expLevel: number
  arena?: { name: string }
  cards: RawCard[]
}

export interface RawBattleSide {
  tag: string
  crowns: number
  startingTrophies?: number
  trophyChange?: number
  cards: { name: string }[]
}

export interface RawBattle {
  type: string
  battleTime: string
  gameMode?: { name: string }
  team: RawBattleSide[]
  opponent: RawBattleSide[]
}
