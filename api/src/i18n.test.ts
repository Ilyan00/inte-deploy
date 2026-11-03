import { describe, expect, it } from 'vitest'
import { detecterLangue, t } from './i18n'

describe('detecterLangue', () => {
  it.each([
    ['pt-BR,pt;q=0.9,en;q=0.8', 'pt'],
    ['en-US', 'en'],
    ['ES', 'es'],
    // Langue non gérée en tête : on prend la suivante qu'on sait servir
    ['de-DE,en;q=0.5', 'en'],
    ['de', 'fr'],
    ['', 'fr'],
    [undefined, 'fr'],
  ])('%s → %s', (entete, attendu) => {
    expect(detecterLangue(entete)).toBe(attendu)
  })
})

describe('t', () => {
  it('traduit et remplace les paramètres', () => {
    expect(t('en', 'erreurs.wishlistPleine', { max: 6 })).toBe(
      'Wishlist is full (6 max)',
    )
    expect(t('fr', 'erreurs.wishlistPleine', { max: 6 })).toBe(
      'Wishlist pleine (6 max)',
    )
  })
})
