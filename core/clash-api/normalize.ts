/**
 * Le jeu affiche un niveau "joueur" sur une échelle 1..GAME_MAX pour toutes
 * les raretés. L'API donne un niveau relatif à la rareté (`level`) et le
 * niveau max de cette rareté (`maxLevel`).
 *
 * Confirmé sur une vraie réponse /players/{tag} (2026-10-23). Si Supercell
 * ajoute un niveau au jeu, GAME_MAX et les bornes de rarityFromMaxLevel
 * (client.ts) bougent ensemble.
 */
export const GAME_MAX = 16

export function normalizeCardLevel(apiLevel: number, apiMaxLevel: number): number {
  return apiLevel + (GAME_MAX - apiMaxLevel)
}
