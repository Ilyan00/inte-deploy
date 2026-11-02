const CLE = 'pokeclasseur:favoris'

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

export default defineNuxtPlugin((nuxtApp) => {
  const { favoris, pret } = useFavoris()

  // Le serveur ne connaît pas le localStorage : on attend la fin de l'hydratation
  // pour charger les favoris, sinon le HTML client diffère du HTML serveur.
  nuxtApp.hook('app:suspense:resolve', () => {
    if (pret.value) return

    try {
      const brut = JSON.parse(localStorage.getItem(CLE) ?? '[]')
      if (Array.isArray(brut)) favoris.value = brut.flatMap(lireFavori)
    } catch {
      // Valeur corrompue ou stockage bloqué (navigation privée) : on repart de zéro.
    }
    pret.value = true

    watch(favoris, (valeur) => {
      try {
        localStorage.setItem(CLE, JSON.stringify(valeur))
      } catch {
        // Quota dépassé ou stockage bloqué : les favoris restent en mémoire pour la session.
      }
    })
  })
})
