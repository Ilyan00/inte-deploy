export default defineNuxtPlugin((nuxtApp) => {
  const { favoris, pret } = useFavoris()

  // Le serveur ne connaît pas le localStorage : on attend la fin de l'hydratation
  // pour charger les favoris, sinon le HTML client diffère du HTML serveur.
  nuxtApp.hook('app:suspense:resolve', () => {
    if (pret.value) return

    favoris.value = chargerFavoris(localStorage)
    pret.value = true

    watch(favoris, (valeur) => sauvegarderFavoris(localStorage, valeur))
  })
})
