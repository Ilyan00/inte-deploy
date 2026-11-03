<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
useHead({ title: () => `${t('favoris.titreOnglet')} · PokéGang` })

const { favoris, pret } = useFavoris()
</script>

<template>
  <div>
    <section class="intro">
      <h1>{{ t('favoris.titre') }}</h1>
      <p v-if="pret && favoris.length">
        {{ t('favoris.compteur', favoris.length) }}
        {{ t('favoris.aide') }}
      </p>
    </section>

    <template v-if="pret">
      <TransitionGroup
        v-if="favoris.length"
        tag="div"
        name="carte"
        class="grille-cartes"
      >
        <PokemonCard v-for="item in favoris" :id="item.id" :key="item.id" />
      </TransitionGroup>

      <div v-else class="etat-vide">
        <strong>{{ t('favoris.vide') }}</strong>
        <p>{{ t('favoris.videAide') }}</p>
        <NuxtLink :to="localePath('/')" class="bouton">{{
          t('favoris.parcourir')
        }}</NuxtLink>
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
