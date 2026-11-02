// Chargé côté serveur pendant le SSR : l'état arrive dans le payload, donc le client
// hydrate avec la bonne wishlist sans refaire l'appel ni décaler le HTML.
export default defineNuxtPlugin(async () => {
  const { pret, charger } = useFavoris()
  if (!pret.value) await charger()
})
