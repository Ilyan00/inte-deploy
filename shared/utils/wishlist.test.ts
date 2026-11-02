import { describe, expect, it } from 'vitest'
import type { WishlistItem } from '../types/pokemon'
import { addPokemon, WISHLIST_MAX } from './wishlist'

const item = (id: number): WishlistItem => ({
  id,
  ajouteLe: '2026-01-01T00:00:00.000Z',
})

describe('addPokemon', () => {
  it('ajoute un Pokémon sans muter la liste d’origine', () => {
    const liste = [item(1)]

    const resultat = addPokemon(liste, 25)

    expect(resultat).toHaveLength(2)
    expect(resultat[1]?.id).toBe(25)
    expect(new Date(resultat[1]!.ajouteLe).toISOString()).toBe(
      resultat[1]!.ajouteLe,
    )
    expect(liste).toHaveLength(1)
  })

  it('ignore un doublon', () => {
    const liste = [item(1), item(25)]

    const resultat = addPokemon(liste, 25)

    expect(resultat).toBe(liste)
  })

  it('refuse l’ajout quand la liste est pleine', () => {
    const liste = Array.from({ length: WISHLIST_MAX }, (_, i) => item(i + 1))

    expect(() => addPokemon(liste, 999)).toThrow('Wishlist pleine')
  })
})
