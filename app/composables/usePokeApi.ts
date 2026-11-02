const API = 'https://pokeapi.co/api/v2'

// Au-delà de 1025, PokéAPI renvoie des formes alternatives (Méga, Gigamax…) qu'on ne veut pas en doublon.
export const NB_POKEMON = 1025

export const TYPES: Record<TypePokemon, string> = {
  normal: 'Normal',
  fire: 'Feu',
  water: 'Eau',
  grass: 'Plante',
  electric: 'Électrik',
  ice: 'Glace',
  fighting: 'Combat',
  poison: 'Poison',
  ground: 'Sol',
  flying: 'Vol',
  psychic: 'Psy',
  bug: 'Insecte',
  rock: 'Roche',
  ghost: 'Spectre',
  dragon: 'Dragon',
  dark: 'Ténèbres',
  steel: 'Acier',
  fairy: 'Fée',
}

const idDepuisUrl = (url: string) =>
  Number(url.split('/').filter(Boolean).pop())

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
}

export async function recupererPokemon(id: number): Promise<Pokemon> {
  const p = await $fetch<PokemonBrut>(`${API}/pokemon/${id}`)
  const stat = (nom: string) =>
    p.stats.find((s) => s.stat.name === nom)?.base_stat ?? 0

  // On ne garde que ce qu'affiche la carte : la réponse brute pèse ~300 Ko par Pokémon.
  return {
    id: p.id,
    nom: p.name,
    types: p.types.map((t) => t.type.name),
    pv: stat('hp'),
    attaque: stat('attack'),
    defense: stat('defense'),
    vitesse: stat('speed'),
    taille: p.height / 10,
    poids: p.weight / 10,
  }
}
