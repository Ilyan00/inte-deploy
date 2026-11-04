// Chargé côté serveur pendant le SSR : l'état arrive dans le payload, donc le client
// hydrate avec la bonne wishlist sans refaire l'appel ni décaler le HTML.
export default defineNuxtPlugin(async () => {
  // Au pré-rendu (fiches au build, site entier en SSG), la wishlist serait figée dans le HTML
  // et marquée comme chargée : le navigateur ne la relirait jamais. On la laisse au client.
  if (import.meta.prerender) return
  const { pret, charger } = useFavoris()
  if (!pret.value) await charger()
})
