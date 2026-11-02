export function useFavoris() {
  const favoris = useState<WishlistItem[]>('favoris', () => [])
  // Faux tant que le localStorage n'a pas été lu (voir plugins/favoris.client.ts)
  const pret = useState('favoris-pret', () => false)

  const estFavori = (id: number) => favoris.value.some((f) => f.id === id)
  function basculer(id: number) {
    favoris.value = estFavori(id)
      ? favoris.value.filter((f) => f.id !== id)
      : [...favoris.value, { id, ajouteLe: new Date().toISOString() }]
  }

  return { favoris, pret, estFavori, basculer }
}
