/**
 * Le jeu affiche un niveau "joueur" sur une échelle 1..GAME_MAX pour toutes
 * les raretés. L'API donne un niveau relatif à la rareté (`level`) et le
 * niveau max de cette rareté (`maxLevel`).
 *
 * ASSOMPTION NON CONFIRMÉE — voir core/clash-api/normalize.test.ts et
 * __fixtures__/player.json pour le détail : aucune fixture réelle n'a pu
 * être capturée (pas de CLASH_API_TOKEN disponible dans cet environnement).
 * À revalider dès qu'une clé API de dev existe.
 */
const GAME_MAX = 14

export function normalizeCardLevel(apiLevel: number, apiMaxLevel: number): number {
  return apiLevel + (GAME_MAX - apiMaxLevel)
}
