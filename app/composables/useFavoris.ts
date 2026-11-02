export function useFavoris() {
  const favoris = useState<WishlistItem[]>('favoris', () => [])
  // Faux tant que le localStorage n'a pas été lu (voir plugins/favoris.client.ts)
  const pret = useState('favoris-pret', () => false)

  const estFavori = (id: number) => favoris.value.some((f) => f.id === id)
  function basculer(id: number) {
    if (estFavori(id)) {
      favoris.value = favoris.value.filter((f) => f.id !== id)
      return
    }
    try {
      favoris.value = addPokemon(favoris.value, id)
    } catch {
      // Liste pleine : on ignore le clic, pas encore de retour visuel côté UI.
    }
  }

  return { favoris, pret, estFavori, basculer }
}
