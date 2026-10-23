import { describe, it, expect } from 'vitest'
import { normalizeCardLevel } from './normalize'

// Confirmé sur une vraie réponse /players/{tag} (2026-10-23) : le jeu affiche
// toutes les cartes sur une échelle 1..16. L'API donne un `level` relatif à la
// rareté et un `maxLevel` (commune 16, rare 14, épique 11, légendaire 8,
// champion 6) ; niveau joueur = level + (16 - maxLevel).
describe('normalizeCardLevel', () => {
  it('commune : level API = niveau joueur', () => {
    expect(normalizeCardLevel(11, 16)).toBe(11)
    expect(normalizeCardLevel(10, 16)).toBe(10)
  })
  it('rare : level 8 / maxLevel 14 => niveau joueur 10', () => {
    expect(normalizeCardLevel(8, 14)).toBe(10)
  })
  it('épique : level 8 / maxLevel 11 => niveau joueur 13', () => {
    expect(normalizeCardLevel(8, 11)).toBe(13)
  })
  it('légendaire : level 2 / maxLevel 8 => niveau joueur 10', () => {
    expect(normalizeCardLevel(2, 8)).toBe(10)
  })
  it('champion : level 3 / maxLevel 6 => niveau joueur 13', () => {
    expect(normalizeCardLevel(3, 6)).toBe(13)
  })
})
