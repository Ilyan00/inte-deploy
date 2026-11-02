import { $fetch } from 'ofetch'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { recupererPokemon } from './usePokeApi'

// Hors Nuxt, `$fetch` n'est pas auto-importé : on fournit le vrai ofetch pour
// qu'il interprète les statuts HTTP (throw sur 404) comme en prod. Seul `fetch`
// (le réseau) est mocké.
const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('$fetch', $fetch)
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

const reponseJson = (corps: unknown, status: number) =>
  new Response(JSON.stringify(corps), {
    status,
    headers: { 'content-type': 'application/json' },
  })

describe('recupererPokemon', () => {
  it('transforme la réponse 200 de PokéAPI en Pokemon', async () => {
    fetchMock.mockResolvedValueOnce(
      reponseJson(
        {
          id: 25,
          name: 'pikachu',
          height: 4,
          weight: 60,
          types: [{ type: { name: 'electric' } }],
          stats: [
            { base_stat: 35, stat: { name: 'hp' } },
            { base_stat: 55, stat: { name: 'attack' } },
            { base_stat: 40, stat: { name: 'defense' } },
            { base_stat: 90, stat: { name: 'speed' } },
          ],
        },
        200,
      ),
    )

    const pokemon = await recupererPokemon(25)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      'https://pokeapi.co/api/v2/pokemon/25',
    )
    expect(pokemon).toEqual({
      id: 25,
      nom: 'pikachu',
      types: ['electric'],
      pv: 35,
      attaque: 55,
      defense: 40,
      vitesse: 90,
      taille: 0.4,
      poids: 6,
    })
  })

  it('rejette quand le Pokémon est introuvable (404)', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Not Found', { status: 404 }))

    await expect(recupererPokemon(99999)).rejects.toMatchObject({
      statusCode: 404,
    })
  })
})
