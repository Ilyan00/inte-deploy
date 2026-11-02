<script setup lang="ts">
const { favoris, pret } = useFavoris()
</script>

<template>
  <header class="entete">
    <div class="conteneur entete__contenu">
      <NuxtLink to="/" class="logo">
        <span class="logo__pastille" aria-hidden="true" />
        <p>PokéGang</p>
      </NuxtLink>

      <nav class="nav" aria-label="Navigation principale">
        <NuxtLink to="/">Collection</NuxtLink>
        <NuxtLink to="/favoris">
          Favoris
          <span v-if="pret" class="nav__compteur">{{ favoris.length }}</span>
        </NuxtLink>
      </nav>
    </div>
  </header>

  <main class="conteneur">
    <NuxtPage />
  </main>

  <footer class="conteneur pied">
    Données
    <a href="https://pokeapi.co/" target="_blank" rel="noopener">PokéAPI</a>.
    Pokémon © Nintendo / Game Freak.
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

.nav {
  display: flex;
  gap: 0.25rem;
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
