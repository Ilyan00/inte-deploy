import { expect, type APIRequestContext, type Page } from '@playwright/test'

// Ports dédiés aux E2E, différents de `pnpm dev` (3000 / 3333) : Playwright ne doit jamais
// tomber sur un serveur de dev branché sur la base cloud, les tests vident la wishlist.
export const FRONT_URL = 'http://localhost:3100'
export const API_URL = 'http://localhost:3334'

export async function lireWishlist(request: APIRequestContext) {
  const res = await request.get(`${API_URL}/wishlist`)
  expect(res.ok()).toBe(true)
  const items = (await res.json()) as { id: number }[]
  return items.map((item) => item.id).sort((a, b) => a - b)
}

// Remise à zéro par l'API elle-même : pas d'accès direct à la base depuis les tests.
export async function viderWishlist(request: APIRequestContext) {
  for (const id of await lireWishlist(request)) {
    const res = await request.delete(`${API_URL}/wishlist/${id}`)
    expect(res.ok()).toBe(true)
  }
}

export async function ajouterViaApi(request: APIRequestContext, ids: number[]) {
  for (const id of ids) {
    const res = await request.post(`${API_URL}/wishlist`, { data: { id } })
    expect(res.status()).toBe(201)
  }
}

// Le HTML SSR est affiché avant que Vue soit branché : un clic ou une saisie
// trop tôt part dans le vide. Vue pose __vue_app__ sur #__nuxt une fois monté.
export async function attendreHydratation(page: Page) {
  await page.waitForFunction(
    () =>
      !!(document.querySelector('#__nuxt') as { __vue_app__?: unknown } | null)
        ?.__vue_app__,
  )
}

export const reponseWishlist = (page: Page, methode: 'POST' | 'DELETE') =>
  page.waitForResponse(
    (res) =>
      res.url().startsWith(`${API_URL}/wishlist`) &&
      res.request().method() === methode,
  )
