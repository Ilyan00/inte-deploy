<script setup lang="ts">
const { favoris, pret } = useFavoris()
const { t, locale, locales, setLocale } = useI18n()
const localePath = useLocalePath()

// lang, dir et liens hreflang alternatifs, mis à jour à chaque changement de langue
const head = useLocaleHead()
useHead({
  htmlAttrs: {
    lang: () => head.value.htmlAttrs.lang,
    dir: () => head.value.htmlAttrs.dir,
  },
  link: () => head.value.link,
  meta: () => [
    ...(head.value.meta ?? []),
    { name: 'description', content: t('meta.description') },
  ],
})
</script>

<template>
  <header class="entete">
    <div class="conteneur entete__contenu">
      <NuxtLink :to="localePath('/')" class="logo">
        <span class="logo__pastille" aria-hidden="true" />
        <p>PokéGang</p>
      </NuxtLink>

      <div class="entete__droite">
        <nav class="nav" :aria-label="t('nav.principale')">
          <NuxtLink :to="localePath('/')">{{ t('nav.collection') }}</NuxtLink>
          <NuxtLink :to="localePath('/favoris')">
            {{ t('nav.favoris') }}
            <span v-if="pret" class="nav__compteur">{{ favoris.length }}</span>
          </NuxtLink>
        </nav>

        <label class="langue">
          <span class="sr-only">{{ t('nav.langue') }}</span>
          <select
            :value="locale"
            @change="
              setLocale(
                ($event.target as HTMLSelectElement).value as typeof locale,
              )
            "
          >
            <option v-for="l in locales" :key="l.code" :value="l.code">
              {{ l.code.toUpperCase() }}
            </option>
          </select>
        </label>
      </div>
    </div>
  </header>

  <main class="conteneur">
    <NuxtPage />
  </main>

  <footer class="conteneur pied">
    {{ t('pied.donnees') }}
    <a href="https://pokeapi.co/" target="_blank" rel="noopener">PokéAPI</a>.
    {{ t('pied.copyright') }}
  </footer>
</template>

<style scoped>
.entete {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgb(20 17 15 / 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--bord);
}

.entete__contenu {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  text-decoration: none;
}

/* Mini Poké Ball en CSS : moitié rouge, moitié crème, bouton central */
.logo__pastille {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  border: 2px solid var(--texte);
  background:
    radial-gradient(
      circle,
      var(--texte) 0 18%,
      var(--fond) 19% 30%,
      transparent 31%
    ),
    linear-gradient(
      to bottom,
      #e3463a 0 46%,
      var(--fond) 46% 54%,
      var(--texte) 54%
    );
}

.entete__droite {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav {
  display: flex;
  gap: 0.25rem;
}

.langue select {
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--bord);
  border-radius: 99px;
  background: var(--surface);
  color: var(--texte);
  font-family: var(--mono);
  font-size: 0.8rem;
  cursor: pointer;
}

.nav a {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  border-radius: 99px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  color: var(--texte-doux);
  transition:
    color 200ms ease,
    background-color 200ms ease;
}

.nav a:hover {
  color: var(--texte);
}

.nav a.router-link-exact-active {
  color: var(--texte);
  background: var(--surface-haute);
}

.nav__compteur {
  min-width: 1.4rem;
  padding: 0.05rem 0.4rem;
  border-radius: 99px;
  background: var(--or);
  color: var(--fond);
  font-family: var(--mono);
  font-size: 0.75rem;
  text-align: center;
}

.pied {
  padding: 3rem 0 2rem;
  font-size: 0.8rem;
  color: var(--texte-doux);
}
</style>
