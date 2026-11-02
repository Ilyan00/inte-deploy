import { afterEach, describe, expect, it, vi } from 'vitest'
import type { WishlistItem } from '../types/pokemon'
import {
  chargerFavoris,
  CLE_FAVORIS,
  sauvegarderFavoris,
} from './favorisStockage'

// Faux localStorage en mémoire : Node n'en fournit pas de fiable.
function fauxStockage(initial: Record<string, string> = {}) {
  const donnees = new Map(Object.entries(initial))
  return {
    getItem: (cle: string) => donnees.get(cle) ?? null,
    setItem: (cle: string, valeur: string) => void donnees.set(cle, valeur),
  }
}

const favoris: WishlistItem[] = [
  { id: 1, ajouteLe: '2026-01-01T00:00:00.000Z' },
  { id: 25, ajouteLe: '2026-02-01T00:00:00.000Z' },
]

afterEach(() => {
  vi.useRealTimers()
})

describe('sauvegarderFavoris', () => {
  it('écrit les favoris en JSON sous la bonne clé', () => {
    const stockage = fauxStockage()

    sauvegarderFavoris(stockage, favoris)

    expect(JSON.parse(stockage.getItem(CLE_FAVORIS)!)).toEqual(favoris)
  })

  it('ne plante pas si le stockage refuse l’écriture (quota, navigation privée)', () => {
    const stockage = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('Quota dépassé', 'QuotaExceededError')
      },
    }

    expect(() => sauvegarderFavoris(stockage, favoris)).not.toThrow()
  })
})

describe('chargerFavoris', () => {
  it('relit ce qui a été sauvegardé', () => {
    const stockage = fauxStockage()
    sauvegarderFavoris(stockage, favoris)

    expect(chargerFavoris(stockage)).toEqual(favoris)
  })

  it('convertit l’ancien format (ids seuls) et écarte les entrées invalides', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-02T12:00:00.000Z'))
    const stockage = fauxStockage({
      [CLE_FAVORIS]: JSON.stringify([
        4,
        { id: 7, ajouteLe: '2026-03-01T00:00:00.000Z' },
        { id: 'pas-un-id', ajouteLe: '2026-03-01T00:00:00.000Z' },
        { id: 9 },
        null,
      ]),
    })

    expect(chargerFavoris(stockage)).toEqual([
      { id: 4, ajouteLe: '2026-11-02T12:00:00.000Z' },
      { id: 7, ajouteLe: '2026-03-01T00:00:00.000Z' },
    ])
  })

  it('renvoie une liste vide quand le stockage est vide', () => {
    expect(chargerFavoris(fauxStockage())).toEqual([])
  })

  it('renvoie une liste vide quand le JSON est invalide', () => {
    const stockage = fauxStockage({ [CLE_FAVORIS]: '{pas du json' })

    expect(chargerFavoris(stockage)).toEqual([])
  })

  it('renvoie une liste vide quand le JSON valide n’est pas un tableau', () => {
    const stockage = fauxStockage({ [CLE_FAVORIS]: '{"id":1}' })

    expect(chargerFavoris(stockage)).toEqual([])
  })
})
