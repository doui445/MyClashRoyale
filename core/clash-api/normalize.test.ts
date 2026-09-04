import { describe, it, expect } from 'vitest'
import { normalizeCardLevel } from './normalize'

// ASSOMPTION NON CONFIRMÉE (aucune fixture réelle disponible — pas de
// CLASH_API_TOKEN dans cet environnement, voir __fixtures__/player.json) :
// le jeu affiche tout le monde sur une échelle 1..14. L'API donne un `level`
// relatif à la rareté et un `maxLevel` (commune 14, rare 12, épique 9,
// légendaire 6, champion 4). Ces bornes de maxLevel par rareté sont
// corroborées par la liste publique /cards (maxLevel observé 4..14), mais la
// formule de conversion elle-même reste à confirmer avec une vraie réponse
// /players/{tag}. À revalider dès qu'une clé API de dev existe.
describe('normalizeCardLevel', () => {
  it('commune : level API = niveau joueur', () => {
    expect(normalizeCardLevel(11, 14)).toBe(11)
  })
  it('légendaire : level 1 / maxLevel 6 => niveau joueur 9', () => {
    expect(normalizeCardLevel(1, 6)).toBe(9)
  })
  it('champion : level 1 / maxLevel 4 => niveau joueur 11', () => {
    expect(normalizeCardLevel(1, 4)).toBe(11)
  })
  it('rare : level 9 / maxLevel 12 => niveau joueur 11', () => {
    expect(normalizeCardLevel(9, 12)).toBe(11)
  })
  it('épique : level 6 / maxLevel 9 => niveau joueur 11', () => {
    expect(normalizeCardLevel(6, 9)).toBe(11)
  })
})
