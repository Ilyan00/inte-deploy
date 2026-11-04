import postgres from 'postgres'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { creerApp } from './app'
import { creerClientSupabase } from './bdd'
import { migrer } from './migrations'

// Mêmes garde-fous que app.test.ts : ces tests vident des tables.
const url = process.env.DATABASE_URL ?? ''
if (
  !/@(127\.0\.0\.1|localhost)[:/]/.test(url) ||
  !/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(process.env.SUPABASE_URL ?? '')
) {
  throw new Error('Tests refusés hors BDD locale')
}

const app = creerApp(creerClientSupabase())
// La clé publishable ne peut pas vider la table (aucune policy d'écriture) :
// la remise à zéro passe par une connexion Postgres directe.
const sql = postgres(url, { max: 1, onnotice: () => {} })

const lireLikes = async (id: number | string) =>
  (await app.request(`/likes/${id}`)).json()
const liker = (id: number | string) =>
  app.request(`/likes/${id}`, { method: 'POST' })

beforeEach(async () => {
  await sql`truncate public.likes`
})
afterAll(async () => {
  await sql`truncate public.likes`
  await sql.end()
})

describe('likes', () => {
  it('un Pokémon jamais liké a 0 like', async () => {
    expect(await lireLikes(25)).toEqual({ id: 25, total: 0 })
  })

  it('chaque POST ajoute un like', async () => {
    expect(await (await liker(25)).json()).toEqual({ id: 25, total: 1 })
    expect(await (await liker(25)).json()).toEqual({ id: 25, total: 2 })
    expect(await lireLikes(25)).toEqual({ id: 25, total: 2 })
    // Compteurs indépendants par Pokémon
    expect(await lireLikes(1)).toEqual({ id: 1, total: 0 })
  })

  it('des likes simultanés sont tous comptés', async () => {
    await Promise.all(Array.from({ length: 10 }, () => liker(7)))
    expect(await lireLikes(7)).toEqual({ id: 7, total: 10 })
  })

  it('refuse un id invalide', async () => {
    expect((await liker('abc')).status).toBe(400)
    expect((await app.request('/likes/0')).status).toBe(400)
  })

  it('la clé publishable ne peut pas écrire directement dans la table', async () => {
    const { error } = await creerClientSupabase()
      .from('likes')
      .insert({ pokemon_id: 1, total: 9999 })
    expect(error).not.toBeNull()
  })

  it('relancer les migrations ne perd ni les likes ni la wishlist', async () => {
    await liker(25)
    await sql`insert into public.wishlist (pokemon_id) values (150) on conflict do nothing`
    try {
      expect(await migrer(sql)).toEqual([])
      expect(await lireLikes(25)).toEqual({ id: 25, total: 1 })
      const [ligne] =
        await sql`select pokemon_id from public.wishlist where pokemon_id = 150`
      expect(ligne).toBeDefined()
    } finally {
      await sql`delete from public.wishlist where pokemon_id = 150`
    }
  })
})
