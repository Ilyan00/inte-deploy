const API = 'https://pokeapi.co/api/v2'

// Ordre d'affichage des filtres ; les libellés traduits sont dans i18n/locales (types.*).
export const TYPES: TypePokemon[] = [
  'normal',
  'fire',
  'water',
  'grass',
  'electric',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
]

const idDepuisUrl = (url: string) => {
  console.log('debug', url)
  return Number(url.split('/').filter(Boolean).pop())
}

// L'URL de l'artwork se déduit de l'id : pas besoin d'attendre le détail pour afficher l'image.
export const imagePokemon = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`

export const formaterNom = (slug: string) =>
  slug
    .split('-')
    .map((mot) => mot.charAt(0).toUpperCase() + mot.slice(1))
    .join(' ')

export async function listerPokemon(): Promise<PokemonResume[]> {
  const res = await $fetch<{ results: { name: string; url: string }[] }>(
    `${API}/pokemon`,
    {
      query: { limit: NB_POKEMON },
    },
  )
  return res.results.map((p) => ({ id: idDepuisUrl(p.url), nom: p.name }))
}

export async function idsParType(type: TypePokemon): Promise<number[]> {
  const res = await $fetch<{ pokemon: { pokemon: { url: string } }[] }>(
    `${API}/type/${type}`,
  )
  return res.pokemon
    .map((p) => idDepuisUrl(p.pokemon.url))
    .filter((id) => id <= NB_POKEMON)
}

// Sous-ensemble de la réponse /pokemon/:id, limité aux champs qu'on lit.
interface PokemonBrut {
  id: number
  name: string
  height: number
  weight: number
  types: { type: { name: TypePokemon } }[]
  stats: { base_stat: number; stat: { name: string } }[]
  abilities: { ability: { name: string }; is_hidden: boolean }[]
}

// PokéAPI accepte indifféremment l'id ou le nom (en minuscules) : /pokemon/25 ou /pokemon/pikachu.
export async function recupererPokemon(
  idOuNom: number | string,
): Promise<Pokemon> {
  const cle = encodeURIComponent(String(idOuNom).toLowerCase())
  const p = await $fetch<PokemonBrut>(`${API}/pokemon/${cle}`)
  const stat = (nom: string) =>
    p.stats.find((s) => s.stat.name === nom)?.base_stat ?? 0

  // On ne garde que ce qu'affichent la carte et la fiche : la réponse brute pèse ~300 Ko par Pokémon.
  return {
    id: p.id,
    nom: p.name,
    types: p.types.map((t) => t.type.name),
    pv: stat('hp'),
    attaque: stat('attack'),
    defense: stat('defense'),
    attaqueSpe: stat('special-attack'),
    defenseSpe: stat('special-defense'),
    vitesse: stat('speed'),
    taille: p.height / 10,
    poids: p.weight / 10,
    talents: p.abilities.map((a) => ({
      nom: a.ability.name,
      cache: a.is_hidden,
    })),
  }
}
