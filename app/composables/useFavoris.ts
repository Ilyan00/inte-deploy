// La wishlist vit côté API (règles métier dans api/src/wishlist.ts) :
// ici on ne fait que refléter son état et relayer les clics.
export function useFavoris() {
  const favoris = useState<WishlistItem[]>('favoris', () => [])
  // Faux tant que la wishlist n'a pas été chargée depuis l'API (voir plugins/favoris.ts)
  const pret = useState('favoris-pret', () => false)

  const api = $fetch.create({ baseURL: useRuntimeConfig().public.apiUrl })

  const estFavori = (id: number) => favoris.value.some((f) => f.id === id)

  async function basculer(id: number) {
    try {
      if (estFavori(id)) {
        await api(`/wishlist/${id}`, { method: 'DELETE' })
        favoris.value = favoris.value.filter((f) => f.id !== id)
      } else {
        const item = await api<WishlistItem>('/wishlist', {
          method: 'POST',
          body: { id },
        })
        favoris.value = [...favoris.value, item]
      }
    } catch {
      // Liste pleine ou API injoignable : on ignore le clic, pas encore de retour visuel côté UI.
    }
  }

  async function charger() {
    try {
      favoris.value = await api<WishlistItem[]>('/wishlist')
      pret.value = true
    } catch {
      // API injoignable : `pret` reste à false, le compteur reste masqué.
    }
  }

  return { favoris, pret, estFavori, basculer, charger }
}
