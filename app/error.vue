<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const { t } = useI18n()
const localePath = useLocalePath()
// error.vue remplace app.vue : il faut reposer lang ici
const head = useLocaleHead()

const est404 = computed(() => props.error.statusCode === 404)

useHead({
  htmlAttrs: { lang: () => head.value.htmlAttrs.lang },
  title: () =>
    `${t(est404.value ? 'erreur.titreIntrouvable' : 'erreur.titreErreur')} · PokéGang`,
})

// clearError réinitialise l'état d'erreur de Nuxt, sinon la page d'erreur reste affichée
const retour = () => clearError({ redirect: localePath('/') })
</script>

<template>
  <main class="conteneur erreur">
    <p class="erreur__code">{{ error.statusCode }}</p>
    <div class="etat-vide">
      <template v-if="est404">
        <strong>{{ t('erreur.introuvable') }}</strong>
        <p>{{ t('erreur.introuvableAide') }}</p>
      </template>
      <template v-else>
        <strong>{{ t('erreur.generique') }}</strong>
        <p>{{ t('erreur.generiqueAide') }}</p>
      </template>
      <button type="button" class="bouton" @click="retour">
        {{ t('erreur.retour') }}
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
