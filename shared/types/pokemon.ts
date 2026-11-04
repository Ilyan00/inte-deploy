// Noms des types tels que renvoyés par PokéAPI (libellés traduits dans i18n/locales, clés types.*).
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

export interface Likes {
  id: Pokemon['id']
  total: number
}
