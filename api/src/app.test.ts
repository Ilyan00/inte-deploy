import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { creerApp } from './app'
import { creerClientSupabase } from './bdd'

// Garde-fou : ces tests vident la table, on refuse tout ce qui n'est pas local.
if (
  !/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(process.env.SUPABASE_URL ?? '')
) {
  throw new Error(`Tests refusés hors BDD locale : ${process.env.SUPABASE_URL}`)
}

const supabase = creerClientSupabase()
const app = creerApp(supabase)

async function viderWishlist() {
  // PostgREST refuse un delete sans filtre : gte 1 couvre toutes les lignes (check en base).
  const { error } = await supabase
    .from('wishlist')
    .delete()
    .gte('pokemon_id', 1)
  if (error) {
    throw new Error(
      `BDD de test injoignable, lance \`pnpm --filter api db:start\` : ${error.message}`,
    )
  }
}

const ajouter = (id: unknown) =>
  app.request('/wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })

const lister = async () => (await app.request('/wishlist')).json()

// Chaque test part d'une table vide : l'ordre des tests n'a plus d'importance.
beforeEach(viderWishlist)
afterAll(viderWishlist)

describe('API Hono + Supabase', () => {
  it('GET /health renvoie 200', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })

  it('GET /wishlist renvoie une liste vide au départ', async () => {
    const res = await app.request('/wishlist')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('POST /wishlist enregistre le pokémon en base', async () => {
    const res = await ajouter(25)
    expect(res.status).toBe(201)
    const item = await res.json()
    expect(item).toMatchObject({ id: 25 })
    expect(new Date(item.ajouteLe).toISOString()).toBe(item.ajouteLe)

    // Vérifie directement en base, pas seulement via l'API.
    const { data } = await supabase.from('wishlist').select('pokemon_id')
    expect(data).toEqual([{ pokemon_id: 25 }])
  })

  it('GET /wishlist renvoie les pokémons dans l’ordre d’ajout', async () => {
    await ajouter(4)
    await ajouter(1)
    await ajouter(7)

    const liste = await lister()
    expect(liste.map((i: { id: number }) => i.id)).toEqual([4, 1, 7])
  })

  it('POST /wishlist ignore un doublon', async () => {
    const premier = await (await ajouter(25)).json()
    const res = await ajouter(25)

    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(premier)
    expect(await lister()).toHaveLength(1)
  })

  it('POST /wishlist renvoie 400 quand la wishlist est pleine', async () => {
    for (const id of [1, 2, 3, 4, 5, 6]) await ajouter(id)

    const res = await ajouter(7)
    expect(res.status).toBe(400)
    expect(await lister()).toHaveLength(6)
  })

  it.each([-3, 0, 1.5, '25'])(
    'POST /wishlist renvoie 400 pour id=%s',
    async (id) => {
      const res = await ajouter(id)
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ erreur: 'id invalide' })
    },
  )

  it('POST /wishlist renvoie 400 pour un JSON cassé', async () => {
    const res = await app.request('/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{pas du json',
    })
    expect(res.status).toBe(400)
  })

  it('DELETE /wishlist/:id retire le pokémon de la base', async () => {
    await ajouter(25)
    await ajouter(4)

    const res = await app.request('/wishlist/25', { method: 'DELETE' })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ id: 25 })

    const { data } = await supabase.from('wishlist').select('pokemon_id')
    expect(data).toEqual([{ pokemon_id: 4 }])
  })

  it('DELETE /wishlist/:id renvoie 404 si le pokémon est absent', async () => {
    const res = await app.request('/wishlist/999', { method: 'DELETE' })
    expect(res.status).toBe(404)
  })

  it('renvoie 500 sans fuiter le détail quand la BDD est injoignable', async () => {
    // fetch truqué : Supabase répond une erreur Postgres, sans dépendre du réseau
    // (sur un vrai échec réseau, supabase-js réessaie et le test traînerait).
    const appEnPanne = creerApp(
      createClient('http://127.0.0.1:54321', 'cle-bidon', {
        global: {
          fetch: async () =>
            Response.json({ message: 'panne', code: 'XX000' }, { status: 500 }),
        },
      }),
    )
    // L'erreur est tracée côté serveur : on la capture pour garder la sortie propre.
    const trace = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await appEnPanne.request('/wishlist')
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ erreur: 'Erreur interne' })
    expect(trace).toHaveBeenCalledOnce()
    trace.mockRestore()
  })

  it('route inconnue renvoie 404', async () => {
    const res = await app.request('/nimporte-quoi')
    expect(res.status).toBe(404)
  })
})
