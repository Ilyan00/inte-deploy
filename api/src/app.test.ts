import { describe, expect, it } from 'vitest'
import { app } from './app'

describe('API Hono', () => {
  it('GET /health renvoie 200', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })

  it('POST /favoris renvoie 201', async () => {
    const res = await app.request('/favoris', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 25 }),
    })
    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({ id: 25 })
  })

  it('route inconnue renvoie 404', async () => {
    const res = await app.request('/nimporte-quoi')
    expect(res.status).toBe(404)
  })
})
