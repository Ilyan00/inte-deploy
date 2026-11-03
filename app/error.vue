<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const est404 = computed(() => props.error.statusCode === 404)

useHead({
  title: () => (est404.value ? 'Introuvable · PokéGang' : 'Erreur · PokéGang'),
})

// clearError réinitialise l'état d'erreur de Nuxt, sinon la page d'erreur reste affichée
const retour = () => clearError({ redirect: '/' })
</script>

<template>
  <main class="conteneur erreur">
    <p class="erreur__code">{{ error.statusCode }}</p>
    <div class="etat-vide">
      <template v-if="est404">
        <strong>Ce Pokémon n'existe pas.</strong>
        <p>Vérifie le nom ou le numéro dans l'adresse (ex. /pokemon/25).</p>
      </template>
      <template v-else>
        <strong>Quelque chose s'est mal passé.</strong>
        <p>Réessaie dans un instant.</p>
      </template>
      <button type="button" class="bouton" @click="retour">
        Retour à la collection
      </button>
    </div>
  </main>
</template>

<style scoped>
.erreur {
  display: grid;
  place-content: center;
  min-height: 100dvh;
}

.erreur__code {
  font-family: var(--mono);
  font-size: clamp(4rem, 15vw, 8rem);
  line-height: 1;
  text-align: center;
  color: var(--or);
}
</style>
