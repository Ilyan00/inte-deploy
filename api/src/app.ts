import { Hono } from 'hono'
import type { WishlistItem } from '../../shared/types/pokemon'
import { addPokemon } from '../../shared/utils/wishlist'

// Pas de BDD pour l'instant : stockage en mémoire, perdu à chaque redémarrage.
let wishlist: WishlistItem[] = []

export const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok' }))

app.get('/wishlist', (c) => c.json(wishlist))

app.post('/wishlist', async (c) => {
  const { id } = await c.req.json<{ id: number }>()
  if (!Number.isInteger(id)) {
    return c.json({ erreur: 'id invalide' }, 400)
  }
  try {
    // Même règle que côté front (doublon ignoré, 6 max) : on réutilise la fonction partagée.
    wishlist = addPokemon(wishlist, id)
  } catch (e) {
    return c.json({ erreur: (e as Error).message }, 400)
  }
  return c.json(
    wishlist.find((item) => item.id === id),
    201,
  )
})

app.delete('/wishlist/:id', (c) => {
  const id = Number(c.req.param('id'))
  const item = wishlist.find((i) => i.id === id)
  if (!item) {
    return c.json({ erreur: 'Pokémon absent de la wishlist' }, 404)
  }
  wishlist = wishlist.filter((i) => i.id !== id)
  return c.json(item)
})

app.notFound((c) => c.json({ erreur: 'Route introuvable' }, 404))
