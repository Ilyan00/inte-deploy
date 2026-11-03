<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const localePath = useLocalePath()
const param = String(route.params.id).toLowerCase()

const introuvable = () =>
  createError({
    statusCode: 404,
    message: t('fiche.introuvable'),
    fatal: true,
  })

// Les slugs PokéAPI ne contiennent que lettres, chiffres et tirets : inutile
// d'appeler l'API pour « /pokemon/%20 » ou « /pokemon/../.. ».
if (!/^[a-z0-9-]+$/.test(param)) throw introuvable()

const {
  data: pokemon,
  error,
  refresh,
} = await useAsyncData(`fiche-${param}`, () => recupererPokemon(param))

// Throw dans le setup (après l'await) : en SSR la réponse part avec un vrai
// statut HTTP 404 et c'est error.vue qui s'affiche, pas un 200 vide.
if (error.value?.statusCode === 404) throw introuvable()

const nom = computed(() => formaterNom(pokemon.value?.nom ?? param))
const couleur = computed(
  () => `var(--type-${pokemon.value?.types[0] ?? 'normal'})`,
)

useHead({ title: () => `${nom.value} · PokéGang` })

const { estFavori, basculer } = useFavoris()

const stats = computed(() => {
  const p = pokemon.value
  if (!p) return []
  return [
    { label: t('stats.pv'), valeur: p.pv },
    { label: t('stats.attaque'), valeur: p.attaque },
    { label: t('stats.defense'), valeur: p.defense },
    { label: t('stats.attaqueSpe'), valeur: p.attaqueSpe },
    { label: t('stats.defenseSpe'), valeur: p.defenseSpe },
    { label: t('stats.vitesse'), valeur: p.vitesse },
  ]
})
const total = computed(() => stats.value.reduce((s, x) => s + x.valeur, 0))

// Les formes alternatives (id > 1025) n'ont pas de voisins logiques
const precedent = computed(() =>
  pokemon.value && pokemon.value.id > 1 && pokemon.value.id <= NB_POKEMON
    ? pokemon.value.id - 1
    : null,
)
const suivant = computed(() =>
  pokemon.value && pokemon.value.id < NB_POKEMON ? pokemon.value.id + 1 : null,
)
</script>

<template>
  <div>
    <div v-if="error" class="etat-vide">
      <strong>{{ t('commun.apiHs') }}</strong>
      <p>{{ t('commun.apiHsAide') }}</p>
      <button type="button" class="bouton" @click="refresh()">
        {{ t('commun.reessayer') }}
      </button>
    </div>

    <article v-else-if="pokemon" class="fiche" :style="{ '--c': couleur }">
      <NuxtLink :to="localePath('/')" class="fiche__retour">{{
        t('fiche.retour')
      }}</NuxtLink>

      <div class="fiche__grille">
        <div class="fiche__visuel">
          <img
            :src="imagePokemon(pokemon.id)"
            :alt="nom"
            width="475"
            height="475"
            fetchpriority="high"
          />
        </div>

        <div class="fiche__infos">
          <p class="fiche__numero">
            {{
              t('commun.numero', {
                numero: String(pokemon.id).padStart(4, '0'),
              })
            }}
          </p>
          <h1>{{ nom }}</h1>

          <ul class="fiche__types">
            <li
              v-for="type in pokemon.types"
              :key="type"
              :style="{ '--t': `var(--type-${type})` }"
            >
              {{ t(`types.${type}`) }}
            </li>
          </ul>

          <dl class="fiche__mesures">
            <div>
              <dt>{{ t('fiche.taille') }}</dt>
              <dd>{{ pokemon.taille }} m</dd>
            </div>
            <div>
              <dt>{{ t('fiche.poids') }}</dt>
              <dd>{{ pokemon.poids }} kg</dd>
            </div>
            <div>
              <dt>{{ t('fiche.talents') }}</dt>
              <dd>
                <span v-for="talent in pokemon.talents" :key="talent.nom">
                  {{ formaterNom(talent.nom)
                  }}<small v-if="talent.cache"> {{ t('fiche.cache') }}</small>
                </span>
              </dd>
            </div>
          </dl>

          <section aria-labelledby="titre-stats">
            <h2 id="titre-stats">{{ t('fiche.statsDeBase') }}</h2>
            <dl class="fiche__stats">
              <div v-for="stat in stats" :key="stat.label">
                <dt>{{ stat.label }}</dt>
                <dd>
                  <span class="barre"
                    ><span
                      :style="{
                        width: `${Math.min(stat.valeur / 255, 1) * 100}%`,
                      }"
                  /></span>
                  {{ stat.valeur }}
                </dd>
              </div>
              <div class="fiche__total">
                <dt>{{ t('fiche.total') }}</dt>
                <dd>{{ total }}</dd>
              </div>
            </dl>
          </section>

          <button
            type="button"
            class="bouton"
            :aria-pressed="estFavori(pokemon.id)"
            @click="basculer(pokemon.id)"
          >
            {{
              t(
                estFavori(pokemon.id)
                  ? 'fiche.dansClasseur'
                  : 'fiche.ajouterClasseur',
              )
            }}
          </button>
        </div>
      </div>

      <nav class="fiche__voisins" :aria-label="t('fiche.voisins')">
        <NuxtLink
          v-if="precedent"
          :to="localePath(`/pokemon/${precedent}`)"
          class="bouton"
        >
          ←
          {{
            t('commun.numero', { numero: String(precedent).padStart(4, '0') })
          }}
        </NuxtLink>
        <NuxtLink
          v-if="suivant"
          :to="localePath(`/pokemon/${suivant}`)"
          class="bouton"
        >
          {{ t('commun.numero', { numero: String(suivant).padStart(4, '0') }) }}
          →
        </NuxtLink>
      </nav>
    </article>
  </div>
</template>

<style scoped>
.fiche {
  padding: 2rem 0 1rem;
}

.fiche__retour {
  display: inline-block;
  margin-bottom: 1.5rem;
  color: var(--texte-doux);
  text-decoration: none;
  font-weight: 600;
}

.fiche__retour:hover {
  color: var(--texte);
}

.fiche__grille {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 2.5rem;
  align-items: start;
}

.fiche__visuel {
  aspect-ratio: 1;
  border-radius: 20px;
  background:
    radial-gradient(
      circle at 50% 60%,
      color-mix(in oklab, var(--c) 55%, transparent),
      transparent 70%
    ),
    color-mix(in oklab, var(--c) 18%, var(--fond));
  border: 1px solid color-mix(in oklab, var(--c) 40%, var(--bord));
}

.fiche__visuel img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 8%;
  filter: drop-shadow(0 16px 20px rgb(0 0 0 / 0.45));
}

.fiche__infos {
  display: grid;
  gap: 1.25rem;
  justify-items: start;
}

.fiche__numero {
  font-family: var(--mono);
  color: var(--texte-doux);
}

.fiche h1 {
  margin-top: -1rem;
  font-size: clamp(2.2rem, 6vw, 3.8rem);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.045em;
}

.fiche h2 {
  margin-bottom: 0.75rem;
  font-size: 1rem;
  font-weight: 700;
}

.fiche__types {
  display: flex;
  gap: 0.4rem;
  list-style: none;
}

.fiche__types li {
  padding: 0.25rem 0.8rem;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 600;
  background: color-mix(in oklab, var(--t) 30%, transparent);
  border: 1px solid color-mix(in oklab, var(--t) 60%, transparent);
}

.fiche__mesures {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem 2.5rem;
}

.fiche__mesures dt {
  font-size: 0.75rem;
  color: var(--texte-doux);
}

.fiche__mesures dd {
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.6rem;
  font-family: var(--mono);
}

.fiche__mesures small {
  color: var(--texte-doux);
}

.fiche section {
  width: 100%;
}

.fiche__stats {
  display: grid;
  gap: 0.45rem;
  font-size: 0.85rem;
}

.fiche__stats div {
  display: grid;
  grid-template-columns: 5rem 1fr;
  align-items: center;
}

.fiche__stats dt {
  color: var(--texte-doux);
}

.fiche__stats dd {
  display: grid;
  grid-template-columns: 1fr 2.2rem;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--mono);
  text-align: right;
}

.fiche__total {
  padding-top: 0.45rem;
  border-top: 1px dashed var(--bord);
}

.fiche__total dd {
  grid-template-columns: 1fr;
}

.barre {
  height: 6px;
  border-radius: 99px;
  background: rgb(255 255 255 / 0.08);
  overflow: hidden;
}

.barre span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--c);
}

.fiche .bouton[aria-pressed='true'] {
  border-color: var(--or);
  color: var(--or);
}

.fiche__voisins {
  display: flex;
  justify-content: space-between;
  margin-top: 3rem;
}

/* Le « suivant » reste à droite même quand il n'y a pas de précédent (N° 1) */
.fiche__voisins a:last-child {
  margin-left: auto;
}

@media (max-width: 760px) {
  .fiche__grille {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .fiche__visuel {
    max-width: 22rem;
    width: 100%;
    justify-self: center;
  }
}
</style>
