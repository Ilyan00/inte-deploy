import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { WishlistItem } from '../../shared/types/pokemon'
import {
  addPokemon,
  ErreurWishlist,
  removePokemon,
  validerId,
} from './wishlist'

// Pas de BDD pour l'instant : stockage en mémoire, perdu à chaque redémarrage.
let wishlist: WishlistItem[] = []

export const app = new Hono()

// Le navigateur appelle l'API depuis l'origine du front Nuxt.
app.use('*', cors({ origin: process.env.FRONT_URL ?? 'http://localhost:3000' }))

app.get('/health', (c) => c.json({ status: 'ok' }))

app.get('/wishlist', (c) => c.json(wishlist))

app.post('/wishlist', async (c) => {
  // Corps absent ou JSON cassé : même réponse 400 qu'un id invalide.
  const corps = await c.req.json<{ id?: unknown }>().catch(() => null)
  const id = validerId(corps?.id)
  wishlist = addPokemon(wishlist, id)
  return c.json(
    wishlist.find((item) => item.id === id),
    201,
  )
})

app.delete('/wishlist/:id', (c) => {
  const id = validerId(Number(c.req.param('id')))
  const item = wishlist.find((i) => i.id === id)
  wishlist = removePokemon(wishlist, id)
  return c.json(item)
})

// Les règles métier lèvent une ErreurWishlist : on la traduit en réponse HTTP ici,
// une seule fois, plutôt qu'un try/catch par route.
app.onError((err, c) => {
  if (err instanceof ErreurWishlist) {
    return c.json({ erreur: err.message }, err.status)
  }
  return c.json({ erreur: 'Erreur interne' }, 500)
})

app.notFound((c) => c.json({ erreur: 'Route introuvable' }, 404))
