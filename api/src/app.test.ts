import { describe, expect, it } from 'vitest'
import { app } from './app'

// Le tableau en mémoire est partagé entre les tests : l'ordre compte.
const ajouter = (id: number) =>
  app.request('/wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })

describe('API Hono', () => {
  it('GET /health renvoie 200', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })

  it('GET /wishlist renvoie 200 et une liste vide au départ', async () => {
    const res = await app.request('/wishlist')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('POST /wishlist renvoie 201 et ajoute le pokémon', async () => {
    const res = await ajouter(25)
    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({ id: 25 })

    const liste = await (await app.request('/wishlist')).json()
    expect(liste).toHaveLength(1)
  })

  it('DELETE /wishlist/:id renvoie 200 et retire le pokémon', async () => {
    const res = await app.request('/wishlist/25', { method: 'DELETE' })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ id: 25 })

    const liste = await (await app.request('/wishlist')).json()
    expect(liste).toEqual([])
  })

  it('DELETE /wishlist/:id renvoie 404 si le pokémon est absent', async () => {
    const res = await app.request('/wishlist/999', { method: 'DELETE' })
    expect(res.status).toBe(404)
  })

  it('route inconnue renvoie 404', async () => {
    const res = await app.request('/nimporte-quoi')
    expect(res.status).toBe(404)
  })
})
