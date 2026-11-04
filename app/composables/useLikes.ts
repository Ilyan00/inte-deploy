// Les fiches sont pré-rendues au build (et entièrement statiques en SSG) : un compteur
// rendu côté serveur resterait figé dans le HTML. On le lit donc depuis le navigateur.
export function useLikes(id: () => number | undefined) {
  const baseURL = useRuntimeConfig().public.apiUrl

  const { data } = useFetch<Likes>(() => `/likes/${id()}`, {
    baseURL,
    server: false,
    immediate: id() !== undefined,
  })

  const enCours = ref(false)

  async function liker() {
    const pokemonId = id()
    if (pokemonId === undefined || enCours.value) return
    enCours.value = true
    try {
      data.value = await $fetch<Likes>(`/likes/${pokemonId}`, {
        baseURL,
        method: 'POST',
      })
    } catch {
      // API injoignable : le compteur ne bouge pas, comme pour les favoris.
    } finally {
      enCours.value = false
    }
  }

  return { total: computed(() => data.value?.total), enCours, liker }
}
