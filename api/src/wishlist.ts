import type { WishlistItem } from '../../shared/types/pokemon'

// Une équipe Pokémon compte 6 membres
export const WISHLIST_MAX = 6

// Les règles vivent ici et nulle part ailleurs : le front ne fait qu'appeler l'API.
// Fonctions pures, testables sans lancer de serveur.

export class ErreurWishlist extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404,
  ) {
    super(message)
  }
}

export function validerId(id: unknown): number {
  if (!Number.isInteger(id) || (id as number) < 1) {
    throw new ErreurWishlist('id invalide', 400)
  }
  return id as number
}

// Un doublon renvoie la liste telle quelle : un double-clic ne doit rien casser.
export function addPokemon(liste: WishlistItem[], id: number): WishlistItem[] {
  if (liste.some((item) => item.id === id)) return liste
  if (liste.length >= WISHLIST_MAX) {
    throw new ErreurWishlist(`Wishlist pleine (${WISHLIST_MAX} max)`, 400)
  }
  return [...liste, { id, ajouteLe: new Date().toISOString() }]
}

export function removePokemon(
  liste: WishlistItem[],
  id: number,
): WishlistItem[] {
  if (!liste.some((item) => item.id === id)) {
    throw new ErreurWishlist('Pokémon absent de la wishlist', 404)
  }
  return liste.filter((item) => item.id !== id)
}
