import { describe, it, expect } from 'vitest'
import { toCardSlug } from './ids'

describe('toCardSlug', () => {
  it('met en kebab-case', () => {
    expect(toCardSlug('Hog Rider')).toBe('hog-rider')
  })
  it('supprime les apostrophes et points', () => {
    expect(toCardSlug('P.E.K.K.A')).toBe('pekka')
    expect(toCardSlug('The Log')).toBe('the-log')
  })
  it('gère les accents et la casse', () => {
    expect(toCardSlug('Barb' + 'è' + 'res')).toBe('barberes')
  })
})
