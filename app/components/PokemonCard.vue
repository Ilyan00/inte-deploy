<script setup lang="ts">
const props = defineProps<{ id: number; nom?: string }>()

const { data: pokemon } = useLazyAsyncData(`pokemon-${props.id}`, () =>
  recupererPokemon(props.id),
)
const { estFavori, basculer } = useFavoris()

const nom = computed(() => formaterNom(pokemon.value?.nom ?? props.nom ?? ''))
const favori = computed(() => estFavori(props.id))
const numero = computed(() => `N° ${String(props.id).padStart(4, '0')}`)
const couleur = computed(
  () => `var(--type-${pokemon.value?.types[0] ?? 'normal'})`,
)

const stats = computed(() =>
  pokemon.value
    ? [
        { label: 'Attaque', valeur: pokemon.value.attaque },
        { label: 'Défense', valeur: pokemon.value.defense },
        { label: 'Vitesse', valeur: pokemon.value.vitesse },
      ]
    : [],
)

// Tilt + reflet holo qui suit la souris. Ignoré au doigt : le pointermove tactile
// se déclenche pendant le scroll et ferait gigoter les cartes.
const carte = ref<HTMLElement>()
const enSurvol = ref(false)

function suivre(e: PointerEvent) {
  if (e.pointerType !== 'mouse' || !carte.value) return
  const r = carte.value.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width
  const y = (e.clientY - r.top) / r.height
  enSurvol.value = true
  carte.value.style.setProperty('--mx', `${x * 100}%`)
  carte.value.style.setProperty('--my', `${y * 100}%`)
  carte.value.style.setProperty('--rx', `${(0.5 - y) * 10}deg`)
  carte.value.style.setProperty('--ry', `${(x - 0.5) * 12}deg`)
}

function relacher() {
  enSurvol.value = false
  carte.value?.style.setProperty('--rx', '0deg')
  carte.value?.style.setProperty('--ry', '0deg')
}
</script>

<template>
  <article
    ref="carte"
    class="carte"
    :class="{ 'carte--survol': enSurvol, 'carte--favori': favori }"
    :style="{ '--c': couleur }"
    @pointermove="suivre"
    @pointerleave="relacher"
  >
    <header class="carte__tete">
      <h3 class="carte__nom">{{ nom }}</h3>
      <p v-if="pokemon" class="carte__pv"><small>PV</small>{{ pokemon.pv }}</p>
    </header>

    <div class="carte__fenetre">
      <img
        :src="imagePokemon(id)"
        :alt="nom"
        width="475"
        height="475"
        loading="lazy"
        decoding="async"
      />
      <button
        type="button"
        class="carte__fav"
        :aria-pressed="favori"
        :aria-label="
          favori ? `Retirer ${nom} des favoris` : `Ajouter ${nom} aux favoris`
        "
        @click="basculer(id)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2.8l2.84 5.76 6.36.92-4.6 4.48 1.08 6.34L12 17.3l-5.68 2.99 1.08-6.34-4.6-4.48 6.36-.92z"
          />
        </svg>
      </button>
    </div>

    <template v-if="pokemon">
      <ul class="carte__types">
        <li
          v-for="type in pokemon.types"
          :key="type"
          :style="{ '--t': `var(--type-${type})` }"
        >
          {{ TYPES[type] ?? type }}
        </li>
      </ul>

      <dl class="carte__stats">
        <div v-for="stat in stats" :key="stat.label">
          <dt>{{ stat.label }}</dt>
          <dd>
            <span class="barre"
              ><span
                :style="{ width: `${Math.min(stat.valeur / 160, 1) * 100}%` }"
            /></span>
            {{ stat.valeur }}
          </dd>
        </div>
      </dl>

      <footer class="carte__pied">
        <span>{{ numero }}</span>
        <span>{{ pokemon.taille }} m · {{ pokemon.poids }} kg</span>
      </footer>
    </template>

    <div v-else class="carte__squelette" aria-hidden="true">
      <span /><span /><span />
    </div>
  </article>
</template>

<style scoped>
.carte {
  --mx: 50%;
  --my: 50%;
  --rx: 0deg;
  --ry: 0deg;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 0.85rem;
  border-radius: 14px;
  background:
    linear-gradient(
      160deg,
      color-mix(in oklab, var(--c) 28%, transparent),
      transparent 55%
    ),
    var(--surface);
  border: 1px solid color-mix(in oklab, var(--c) 40%, var(--bord));
  box-shadow:
    0 1px 0 rgb(255 255 255 / 0.06) inset,
    0 12px 28px -14px rgb(0 0 0 / 0.7);
  transform: perspective(900px) rotateX(var(--rx)) rotateY(var(--ry));
  transition:
    transform 450ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 300ms ease,
    border-color 300ms ease;
  isolation: isolate;
  container: carte / inline-size;
}

.carte--survol {
  transition-duration: 90ms, 300ms, 300ms;
  box-shadow:
    0 1px 0 rgb(255 255 255 / 0.08) inset,
    0 26px 40px -18px color-mix(in oklab, var(--c) 55%, black);
}

/* Reflet holographique : un halo qui suit le curseur + un léger arc-en-ciel */
.carte::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background:
    radial-gradient(
      circle at var(--mx) var(--my),
      rgb(255 255 255 / 0.35),
      transparent 45%
    ),
    linear-gradient(
      115deg,
      transparent 20%,
      rgb(255 120 180 / 0.18) 35%,
      rgb(120 220 255 / 0.18) 50%,
      rgb(255 230 120 / 0.18) 65%,
      transparent 80%
    );
  background-size:
    100% 100%,
    250% 250%;
  background-position:
    center,
    var(--mx) var(--my);
  mix-blend-mode: overlay;
  opacity: 0;
  transition: opacity 300ms ease;
  z-index: 2;
}

.carte--survol::after {
  opacity: 1;
}

.carte--favori {
  border-color: var(--or);
}

.carte__tete {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.carte__nom {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.carte__pv {
  flex-shrink: 0;
  font-family: var(--mono);
  font-size: 1.05rem;
  font-weight: 500;
}

.carte__pv small {
  font-size: 0.65rem;
  margin-right: 0.15rem;
  color: var(--texte-doux);
}

.carte__fenetre {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  background:
    radial-gradient(
      circle at 50% 60%,
      color-mix(in oklab, var(--c) 55%, transparent),
      transparent 70%
    ),
    color-mix(in oklab, var(--c) 18%, var(--fond));
  border: 1px solid rgb(255 255 255 / 0.08);
  overflow: hidden;
}

.carte__fenetre img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 8%;
  filter: drop-shadow(0 10px 12px rgb(0 0 0 / 0.45));
  transition: transform 450ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.carte--survol .carte__fenetre img {
  transform: scale(1.06) translateY(-2%);
}

.carte__fav {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 0;
  border-radius: 50%;
  background: rgb(20 17 15 / 0.55);
  backdrop-filter: blur(6px);
  color: var(--texte);
  cursor: pointer;
  transition:
    background-color 200ms ease,
    transform 160ms ease;
}

.carte__fav:hover {
  background: rgb(20 17 15 / 0.8);
}

.carte__fav:active {
  transform: scale(0.9);
}

.carte__fav svg {
  width: 1.2rem;
  height: 1.2rem;
  fill: transparent;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linejoin: round;
}

.carte__fav[aria-pressed='true'] {
  color: var(--or);
}

.carte__fav[aria-pressed='true'] svg {
  fill: currentColor;
  animation: pop 320ms cubic-bezier(0.3, 1.6, 0.5, 1);
}

@keyframes pop {
  from {
    transform: scale(0.6);
  }
}

.carte__types {
  display: flex;
  gap: 0.35rem;
  list-style: none;
}

.carte__types li {
  padding: 0.15rem 0.55rem;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 600;
  background: color-mix(in oklab, var(--t) 30%, transparent);
  border: 1px solid color-mix(in oklab, var(--t) 60%, transparent);
}

.carte__stats {
  display: grid;
  gap: 0.3rem;
  font-size: 0.75rem;
}

.carte__stats div {
  display: grid;
  grid-template-columns: 4.2rem 1fr;
  align-items: center;
}

.carte__stats dt {
  color: var(--texte-doux);
}

.carte__stats dd {
  display: grid;
  grid-template-columns: 1fr 1.8rem;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--mono);
  text-align: right;
}

.barre {
  height: 4px;
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

.carte__pied {
  display: flex;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 0.55rem;
  border-top: 1px dashed var(--bord);
  font-family: var(--mono);
  font-size: 0.68rem;
  color: var(--texte-doux);
}

.carte__squelette {
  display: grid;
  gap: 0.5rem;
}

.carte__squelette span {
  height: 0.75rem;
  border-radius: 4px;
  background: rgb(255 255 255 / 0.06);
  animation: pulse 1.2s ease-in-out infinite alternate;
}

.carte__squelette span:first-child {
  width: 45%;
  height: 1.3rem;
}

@keyframes pulse {
  to {
    opacity: 0.4;
  }
}

/* Carte étroite (2 colonnes sur mobile) : on garde l'essentiel */
@container carte (max-width: 200px) {
  .carte__stats,
  .carte__pied span:last-child {
    display: none;
  }

  .carte__nom {
    font-size: 0.95rem;
  }

  .carte__fav {
    width: 2.25rem;
    height: 2.25rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .carte,
  .carte__fenetre img {
    transform: none !important;
  }

  .carte__fav[aria-pressed='true'] svg,
  .carte__squelette span {
    animation: none;
  }
}
</style>
