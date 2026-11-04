import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Likes, WishlistItem } from '../../shared/types/pokemon'
import { detecterLangue, t } from './i18n'
import {
  addPokemon,
  ErreurWishlist,
  removePokemon,
  validerId,
} from './wishlist'

interface LigneWishlist {
  pokemon_id: number
  ajoute_le: string
}

// Le front attend toujours le format WishlistItem : la BDD reste un détail interne.
const versItem = (ligne: LigneWishlist): WishlistItem => ({
  id: ligne.pokemon_id,
  ajouteLe: new Date(ligne.ajoute_le).toISOString(),
})

// Les erreurs Supabase sont des objets simples : Hono ne passe à onError que des
// vraies Error et relance le reste, d'où l'emballage.
function erreurBdd(error: { message: string }): Error {
  return new Error(`Supabase : ${error.message}`, { cause: error })
}

// Le client est injecté pour que les tests puissent viser la base locale.
export function creerApp(supabase: SupabaseClient) {
  const app = new Hono()

  async function lireWishlist(): Promise<WishlistItem[]> {
    const { data, error } = await supabase
      .from('wishlist')
      .select('pokemon_id, ajoute_le')
      .order('ajoute_le')
    if (error) throw erreurBdd(error)
    return (data as LigneWishlist[]).map(versItem)
  }

  // Le navigateur appelle l'API depuis l'origine du front Nuxt. Plusieurs fronts en prod
  // (SSR sur Vercel, SSG sur CloudFront) : FRONT_URL accepte une liste séparée par des virgules.
  app.use(
    '*',
    cors({
      origin: (process.env.FRONT_URL ?? 'http://localhost:3000')
        .split(',')
        .map((url) => url.trim()),
    }),
  )

  app.get('/health', (c) => c.json({ status: 'ok' }))

  app.get('/wishlist', async (c) => c.json(await lireWishlist()))

  app.post('/wishlist', async (c) => {
    // Corps absent ou JSON cassé : même réponse 400 qu'un id invalide.
    const corps = await c.req.json<{ id?: unknown }>().catch(() => null)
    const id = validerId(corps?.id)

    // Les règles (6 max, doublon ignoré) restent dans wishlist.ts :
    // on les applique sur l'état lu en base, puis on écrit seulement si besoin.
    // addPokemon renvoie la même liste pour un doublon et lève une erreur si elle est pleine.
    const liste = await lireWishlist()
    if (addPokemon(liste, id) === liste) {
      return c.json(
        liste.find((item) => item.id === id),
        201,
      )
    }

    const { data, error } = await supabase
      .from('wishlist')
      .insert({ pokemon_id: id })
      .select('pokemon_id, ajoute_le')
      .single()
    // 23505 = la PK a bloqué un doublon arrivé en même temps : même effet qu'un double-clic.
    if (error?.code === '23505') {
      const item = (await lireWishlist()).find((i) => i.id === id)
      return c.json(item, 201)
    }
    if (error) throw erreurBdd(error)
    return c.json(versItem(data as LigneWishlist), 201)
  })

  app.delete('/wishlist/:id', async (c) => {
    const id = validerId(Number(c.req.param('id')))
    const liste = await lireWishlist()
    // Lève la 404 si le pokémon est absent.
    removePokemon(liste, id)

    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('pokemon_id', id)
    if (error) throw erreurBdd(error)
    return c.json(liste.find((item) => item.id === id))
  })

  app.get('/likes/:id', async (c) => {
    const id = validerId(Number(c.req.param('id')))
    const { data, error } = await supabase
      .from('likes')
      .select('total')
      .eq('pokemon_id', id)
      .maybeSingle()
    if (error) throw erreurBdd(error)
    // Jamais liké = pas de ligne : 0 plutôt qu'une 404, le compteur existe pour tout Pokémon.
    return c.json<Likes>({ id, total: data?.total ?? 0 })
  })

  app.post('/likes/:id', async (c) => {
    const id = validerId(Number(c.req.param('id')))
    // L'incrément se fait en base (fonction liker, voir migrations) pour rester atomique.
    const { data, error } = await supabase.rpc('liker', { p_pokemon_id: id })
    if (error) throw erreurBdd(error)
    return c.json<Likes>({ id, total: data as number })
  })

  // Les règles métier lèvent une ErreurWishlist : on la traduit en réponse HTTP ici,
  // une seule fois, plutôt qu'un try/catch par route.
  app.onError((err, c) => {
    const langue = detecterLangue(c.req.header('Accept-Language'))
    if (err instanceof ErreurWishlist) {
      return c.json({ erreur: t(langue, err.cle, err.params) }, err.status)
    }
    // Erreur BDD ou bug : on la trace côté serveur, le client n'a pas à voir le détail.
    // eslint-disable-next-line no-console -- seule trace d'une erreur serveur
    console.error(err)
    return c.json({ erreur: t(langue, 'erreurs.interne') }, 500)
  })

  app.notFound((c) => {
    const langue = detecterLangue(c.req.header('Accept-Language'))
    return c.json({ erreur: t(langue, 'erreurs.routeIntrouvable') }, 404)
  })

  return app
}
