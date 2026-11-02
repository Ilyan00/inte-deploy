export function useFavoris() {
  const favoris = useState<number[]>('favoris', () => [])
  // Faux tant que le localStorage n'a pas été lu (voir plugins/favoris.client.ts)
  const pret = useState('favoris-pret', () => false)

  const estFavori = (id: number) => favoris.value.includes(id)

  function basculer(id: number) {
    favoris.value = estFavori(id) ? favoris.value.filter((f) => f !== id) : [...favoris.value, id]
  }

  return { favoris, pret, estFavori, basculer }
}
