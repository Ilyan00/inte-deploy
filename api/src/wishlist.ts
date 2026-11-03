import type { WishlistItem } from '../../shared/types/pokemon'
import { LANGUE_PAR_DEFAUT, t, type CleTraduction, type Params } from './i18n'

// Une équipe Pokémon compte 6 membres
export const WISHLIST_MAX = 6

// Les règles vivent ici et nulle part ailleurs : le front ne fait qu'appeler l'API.
// Fonctions pures, testables sans lancer de serveur.

// On garde la clé + les paramètres pour que app.ts traduise dans la langue du client ;
// message reste en français pour les logs et les tests.
export class ErreurWishlist extends Error {
  constructor(
    readonly cle: CleTraduction,
    readonly status: 400 | 404,
    readonly params: Params = {},
  ) {
    super(t(LANGUE_PAR_DEFAUT, cle, params))
  }
}

export function validerId(id: unknown): number {
  if (!Number.isInteger(id) || (id as number) < 1) {
    throw new ErreurWishlist('erreurs.idInvalide', 400)
  }
  return id as number
}

// Un doublon renvoie la liste telle quelle : un double-clic ne doit rien casser.
export function addPokemon(liste: WishlistItem[], id: number): WishlistItem[] {
  if (liste.some((item) => item.id === id)) return liste
  if (liste.length >= WISHLIST_MAX) {
    throw new ErreurWishlist('erreurs.wishlistPleine', 400, {
      max: WISHLIST_MAX,
    })
  }
  return [...liste, { id, ajouteLe: new Date().toISOString() }]
}

export function removePokemon(
  liste: WishlistItem[],
  id: number,
): WishlistItem[] {
  if (!liste.some((item) => item.id === id)) {
    throw new ErreurWishlist('erreurs.absentDeWishlist', 404)
  }
  return liste.filter((item) => item.id !== id)
}
