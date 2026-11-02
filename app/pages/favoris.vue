<script setup lang="ts">
useHead({ title: "Mes favoris · PokéGang" });

const { favoris, pret } = useFavoris();
</script>

<template>
  <div>
    <section class="intro">
      <h1>Mon classeur</h1>
      <p v-if="pret && favoris.length">
        {{ favoris.length }} carte{{ favoris.length > 1 ? "s" : "" }} rangée{{
          favoris.length > 1 ? "s" : ""
        }}. Clique à nouveau sur l'étoile pour en retirer une.
      </p>
    </section>

    <template v-if="pret">
      <TransitionGroup
        v-if="favoris.length"
        tag="div"
        name="carte"
        class="grille-cartes"
      >
        <PokemonCard v-for="id in favoris" :id="id" :key="id" />
      </TransitionGroup>

      <div v-else class="etat-vide">
        <strong>Ton classeur est vide.</strong>
        <p>Clique sur l'étoile d'une carte pour l'ajouter ici.</p>
        <NuxtLink to="/" class="bouton">Parcourir la collection</NuxtLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.intro {
  padding: 3.5rem 0 2rem;
}

.intro h1 {
  font-size: clamp(2.2rem, 6vw, 3.8rem);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.045em;
}

.intro p {
  margin-top: 1rem;
  color: var(--texte-doux);
}

.carte-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.carte-leave-to {
  opacity: 0;
  transform: scale(0.94);
}

.carte-move {
  transition: transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
</style>
