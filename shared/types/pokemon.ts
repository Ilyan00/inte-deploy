// Noms des types tels que renvoyés par PokéAPI (les libellés FR sont dans TYPES, usePokeApi.ts).
export type TypePokemon =
  | 'normal'
  | 'fire'
  | 'water'
  | 'grass'
  | 'electric'
  | 'ice'
  | 'fighting'
  | 'poison'
  | 'ground'
  | 'flying'
  | 'psychic'
  | 'bug'
  | 'rock'
  | 'ghost'
  | 'dragon'
  | 'dark'
  | 'steel'
  | 'fairy'

export interface PokemonResume {
  id: number
  nom: string
}

export interface Pokemon {
  id: number
  nom: string
  types: TypePokemon[]
  pv: number
  attaque: number
  defense: number
  attaqueSpe: number
  defenseSpe: number
  vitesse: number
  taille: number // en mètres
  poids: number // en kg
  talents: { nom: string; cache: boolean }[]
}

export interface WishlistItem {
  id: Pokemon['id']
  ajouteLe: string // date ISO : reste lisible une fois sérialisée dans le localStorage
}
