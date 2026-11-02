<script setup lang="ts">
const PAR_PAGE = 24;

const recherche = ref("");
const type = ref<string | null>(null);
const typesOuverts = ref(false);
const limite = ref(PAR_PAGE);

const {
  data: tous,
  error,
  refresh,
} = await useAsyncData("pokemon-liste", listerPokemon);
const { data: idsDuType, status: statutType } = await useAsyncData(
  "pokemon-type",
  () => (type.value ? idsParType(type.value) : Promise.resolve(null)),
  { watch: [type] },
);

const resultats = computed(() => {
  // « #25 », « 25 » ou « mr mime » doivent tous marcher
  const q = recherche.value
    .trim()
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/\s+/g, "-");
  const ids = idsDuType.value ? new Set(idsDuType.value) : null;

  return (tous.value ?? []).filter(
    (p) =>
      (!ids || ids.has(p.id)) &&
      (!q || p.nom.includes(q) || String(p.id) === q.replace(/^0+/, "")),
  );
});

const visibles = computed(() => resultats.value.slice(0, limite.value));

watch([recherche, type], () => {
  limite.value = PAR_PAGE;
});

function choisirType(t: string | null) {
  type.value = type.value === t ? null : t;
  // On replie après un choix : le type actif reste visible seul
  typesOuverts.value = false;
}
</script>

<template>
  <section class="intro">
    <h1>Attrapez les tous</h1>
  </section>

  <div class="filtres">
    <label class="recherche">
      <span class="sr-only">Rechercher un Pokémon</span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        v-model="recherche"
        type="search"
        placeholder="Pikachu, #25…"
        autocomplete="off"
      />
    </label>

    <div class="types">
      <button
        type="button"
        class="types__toggle"
        :aria-expanded="typesOuverts"
        aria-controls="liste-types"
        @click="typesOuverts = !typesOuverts"
      >
        Types
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>

      <div
        id="liste-types"
        class="types__liste"
        role="group"
        aria-label="Filtrer par type"
      >
        <button
          v-show="typesOuverts"
          type="button"
          :aria-pressed="type === null"
          @click="choisirType(null)"
        >
          Tous
        </button>
        <button
          v-for="(label, cle, i) in TYPES"
          v-show="typesOuverts || type === cle"
          :key="cle"
          type="button"
          :aria-pressed="type === cle"
          :style="{ '--t': `var(--type-${cle})`, '--i': i + 1 }"
          @click="choisirType(cle)"
        >
          {{ label }}
        </button>
      </div>
    </div>
  </div>

  <div v-if="error" class="etat-vide">
    <strong>PokéAPI ne répond pas.</strong>
    <p>Vérifie ta connexion, puis réessaie.</p>
    <button type="button" class="bouton" @click="refresh()">Réessayer</button>
  </div>

  <template v-else>
    <p class="compteur" aria-live="polite">
      <template v-if="statutType === 'pending'">Chargement…</template>
      <template v-else>{{ resultats.length }} Pokémon</template>
    </p>

    <div v-if="visibles.length" class="grille-cartes">
      <PokemonCard v-for="p in visibles" :id="p.id" :key="p.id" :nom="p.nom" />
    </div>

    <div v-else-if="statutType !== 'pending'" class="etat-vide">
      <strong>Aucun Pokémon ne correspond.</strong>
      <p>Essaie un autre nom, ou retire le filtre de type.</p>
    </div>

    <div v-if="resultats.length > limite" class="plus">
      <button type="button" class="bouton" @click="limite += PAR_PAGE">
        Voir plus
        <span class="plus__restant"
          >{{ resultats.length - limite }} restants</span
        >
      </button>
    </div>
  </template>
</template>

<style scoped>
.intro {
  padding: 3.5rem 0 2rem;
  max-width: 40rem;
}

.intro h1 {
  font-size: clamp(2.2rem, 6vw, 3.8rem);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.045em;
}

.intro p {
  margin-top: 1rem;
  font-size: 1.05rem;
  line-height: 1.5;
  color: var(--texte-doux);
}

.filtres {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.recherche {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  max-width: 24rem;
  padding: 0 1rem;
  border: 1px solid var(--bord);
  border-radius: 99px;
  background: var(--surface);
  transition: border-color 200ms ease;
}

.recherche:focus-within {
  border-color: var(--or);
}

.recherche svg {
  flex-shrink: 0;
  width: 1.1rem;
  height: 1.1rem;
  fill: none;
  stroke: var(--texte-doux);
  stroke-width: 2;
  stroke-linecap: round;
}

.recherche input {
  flex: 1;
  min-width: 0;
  height: 2.9rem;
  border: 0;
  background: none;
  outline: none;
  /* 16px minimum sinon iOS zoome au focus */
  font-size: 1rem;
}

.types {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
}

.types__liste {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 0.4rem;
  min-width: 0;
}

.types__toggle {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.3rem;
}

.types__toggle svg {
  width: 0.9rem;
  height: 0.9rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform 200ms ease;
}

.types__toggle[aria-expanded="true"] svg {
  transform: rotate(180deg);
}

.types button {
  --t: var(--texte-doux);
  padding: 0.35rem 0.8rem;
  border: 1px solid var(--bord);
  border-radius: 99px;
  background: transparent;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 200ms ease,
    border-color 200ms ease;
}

/* Une animation CSS rejoue à chaque passage de display:none à visible (v-show),
   donc pas besoin de <TransitionGroup>. Le type actif, qui reste affiché au
   repli, ne rejoue pas. */
.types__liste button {
  animation: apparition-pastille 220ms cubic-bezier(0.23, 1, 0.32, 1) both;
  animation-delay: calc(var(--i, 0) * 14ms);
}

@keyframes apparition-pastille {
  from {
    opacity: 0;
    transform: translateX(-0.4rem) scale(0.94);
  }
}

@media (prefers-reduced-motion: reduce) {
  .types__liste button {
    animation: none;
  }
}

.types button:hover {
  border-color: var(--t);
}

.types button[aria-pressed="true"] {
  border-color: var(--t);
  background: color-mix(in oklab, var(--t) 30%, transparent);
}

.compteur {
  margin-bottom: 1rem;
  font-family: var(--mono);
  font-size: 0.8rem;
  color: var(--texte-doux);
}

.plus {
  display: flex;
  justify-content: center;
  margin-top: 2.5rem;
}

.plus__restant {
  font-family: var(--mono);
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--texte-doux);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* Sur mobile, les 18 types tiennent mieux sur une ligne qui défile */
@media (max-width: 640px) {
  .types__liste {
    flex-wrap: nowrap;
    overflow-x: auto;
    margin-right: -1rem;
    padding-right: 1rem;
    scrollbar-width: none;
  }

  .types button {
    flex-shrink: 0;
  }
}
</style>
