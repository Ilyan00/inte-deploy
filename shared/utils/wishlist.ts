import type { WishlistItem } from '../types/pokemon'

// Une équipe Pokémon compte 6 membres
export const WISHLIST_MAX = 6

// Fonction pure (pas de useState) pour rester testable sans environnement Nuxt.
// Un doublon renvoie la liste telle quelle : un double-clic ne doit rien casser.
export function addPokemon(liste: WishlistItem[], id: number): WishlistItem[] {
  if (liste.some((item) => item.id === id)) return liste
  if (liste.length >= WISHLIST_MAX) {
    throw new Error(`Wishlist pleine (${WISHLIST_MAX} max)`)
  }
  return [...liste, { id, ajouteLe: new Date().toISOString() }]
}
