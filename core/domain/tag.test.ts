import { describe, it, expect } from 'vitest'
import { isValidTag, normalizeTag } from './tag'

describe('tag joueur', () => {
  it('normalise : majuscules, préfixe #, O→0', () => {
    expect(normalizeTag('  #abc123  ')).toBe('#ABC123')
    expect(normalizeTag('abc123')).toBe('#ABC123')
    expect(normalizeTag('#OO9')).toBe('#009')
  })
  it('valide : # + 3 à 12 caractères de [0289PYLQGRJCUV]', () => {
    expect(isValidTag('#2PP')).toBe(true)
    expect(isValidTag('#ABC-123')).toBe(false)
    expect(isValidTag('#')).toBe(false)
    expect(isValidTag('#ZZZ')).toBe(false) // Z n'est pas dans l'alphabet des tags Supercell
  })
})
