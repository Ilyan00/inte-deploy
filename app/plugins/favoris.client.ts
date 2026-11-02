const CLE = 'pokeclasseur:favoris'

export default defineNuxtPlugin((nuxtApp) => {
  const { favoris, pret } = useFavoris()

  // Le serveur ne connaît pas le localStorage : on attend la fin de l'hydratation
  // pour charger les favoris, sinon le HTML client diffère du HTML serveur.
  nuxtApp.hook('app:suspense:resolve', () => {
    if (pret.value) return

    try {
      const brut = JSON.parse(localStorage.getItem(CLE) ?? '[]')
      if (Array.isArray(brut)) favoris.value = brut.filter(Number.isInteger)
    } catch {
      // Valeur corrompue ou stockage bloqué (navigation privée) : on repart de zéro.
    }
    pret.value = true

    watch(favoris, (valeur) => {
      try {
        localStorage.setItem(CLE, JSON.stringify(valeur))
      } catch {}
    })
  })
})
