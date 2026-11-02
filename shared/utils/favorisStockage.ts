import type { WishlistItem } from '../types/pokemon'

export const CLE_FAVORIS = 'pokeclasseur:favoris'

// Le stockage est passé en paramètre (et non lu sur window) pour rester testable
// hors navigateur avec un faux Storage. Typé à la main car `shared/` n'a pas la lib DOM.
interface Stockage {
  getItem(cle: string): string | null
  setItem(cle: string, valeur: string): void
}

// Les anciennes versions stockaient juste des ids : on les convertit au lieu de perdre
// les favoris existants. Renvoie [] pour une entrée invalide (filtrée par flatMap).
function lireFavori(entree: unknown): WishlistItem[] {
  if (Number.isInteger(entree)) {
    return [{ id: entree as number, ajouteLe: new Date().toISOString() }]
  }
  const item = entree as Partial<WishlistItem> | null
  if (Number.isInteger(item?.id) && typeof item?.ajouteLe === 'string') {
    return [{ id: item.id as number, ajouteLe: item.ajouteLe }]
  }
  return []
}

export function chargerFavoris(stockage: Stockage): WishlistItem[] {
  try {
    const brut = JSON.parse(stockage.getItem(CLE_FAVORIS) ?? '[]')
    return Array.isArray(brut) ? brut.flatMap(lireFavori) : []
  } catch {
    // Valeur corrompue ou stockage bloqué (navigation privée) : on repart de zéro.
    return []
  }
}

export function sauvegarderFavoris(
  stockage: Stockage,
  favoris: WishlistItem[],
): void {
  try {
    stockage.setItem(CLE_FAVORIS, JSON.stringify(favoris))
  } catch {
    // Quota dépassé ou stockage bloqué : les favoris restent en mémoire pour la session.
  }
}
