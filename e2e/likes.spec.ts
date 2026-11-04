import { expect, test } from '@playwright/test'
import { API_URL, attendreHydratation } from './outils'

// Pas de remise à zéro (la table n'est pas modifiable via l'API) : on part du compteur actuel.
async function lireLikes(
  request: import('@playwright/test').APIRequestContext,
  id: number,
) {
  const res = await request.get(`${API_URL}/likes/${id}`)
  expect(res.ok()).toBe(true)
  return ((await res.json()) as { total: number }).total
}

test('un like depuis la fiche est compté en base et survit au rechargement', async ({
  page,
  request,
}) => {
  const avant = await lireLikes(request, 25)

  await page.goto('/pokemon/25')
  await attendreHydratation(page)

  const bouton = page.getByRole('button', { name: /J’aime/ })
  const compteur = bouton.locator('.fiche__likes')
  // Lu côté client : la fiche pré-rendue n'embarque pas de compteur figé
  await expect(compteur).toHaveText(String(avant))

  const reponse = page.waitForResponse(
    (res) =>
      res.url() === `${API_URL}/likes/25` && res.request().method() === 'POST',
  )
  await bouton.click()
  expect((await reponse).status()).toBe(200)
  await expect(compteur).toHaveText(String(avant + 1))
  expect(await lireLikes(request, 25)).toBe(avant + 1)

  await page.reload()
  await expect(compteur).toHaveText(String(avant + 1))
})

test('les compteurs sont propres à chaque Pokémon', async ({
  page,
  request,
}) => {
  const avant = await lireLikes(request, 26)

  await page.goto('/pokemon/25')
  await attendreHydratation(page)
  const bouton = page.getByRole('button', { name: /J’aime/ })
  await expect(bouton).toBeEnabled()
  await bouton.click()

  await page.getByRole('link', { name: /N° 0026/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Raichu')
  await expect(bouton.locator('.fiche__likes')).toHaveText(String(avant))
})
