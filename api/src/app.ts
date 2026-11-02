import { Hono } from 'hono'

// Pas de BDD pour l'instant : stockage en mémoire, perdu à chaque redémarrage.
const favoris: { id: number; ajouteLe: string }[] = []

export const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok' }))

app.post('/favoris', async (c) => {
  const { id } = await c.req.json<{ id: number }>()
  const favori = { id, ajouteLe: new Date().toISOString() }
  favoris.push(favori)
  return c.json(favori, 201)
})

app.notFound((c) => c.json({ erreur: 'Route introuvable' }, 404))
