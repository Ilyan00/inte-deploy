import { expect, test } from '@playwright/test'
import {
  ajouterViaApi,
  attendreHydratation,
  FRONT_URL,
  lireWishlist,
  reponseWishlist,
  viderWishlist,
} from './outils'

test.beforeEach(async ({ request }) => {
  await viderWishlist(request)
})

test('un favori ajouté depuis la fiche est enregistré en base', async ({
  page,
  request,
  browser,
}) => {
  await page.goto('/pokemon/25')
  await attendreHydratation(page)

  const reponse = reponseWishlist(page, 'POST')
  await page.getByRole('button', { name: '☆ Ajouter au classeur' }).click()
  expect((await reponse).status()).toBe(201)

  const bouton = page.getByRole('button', { name: '★ Dans mon classeur' })
  await expect(bouton).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('link', { name: /Favoris/ })).toContainText('1')
  expect(await lireWishlist(request)).toEqual([25])

  await page.reload()
  await expect(bouton).toHaveAttribute('aria-pressed', 'true')

  // Contexte vierge (ni cookies ni localStorage) : si le favori est là, il vient de l'API
  const autreContexte = await browser.newContext({ locale: 'fr-FR' })
  const autrePage = await autreContexte.newPage()
  await autrePage.goto(`${FRONT_URL}/favoris`)
  await expect(autrePage.getByText('1 carte rangée.')).toBeVisible()
  await expect(
    autrePage.getByRole('link', { name: 'Pikachu', exact: true }),
  ).toBeVisible()
  await autreContexte.close()
})

test('retirer un favori depuis le classeur', async ({ page, request }) => {
  await ajouterViaApi(request, [4, 25])
  await page.goto('/favoris')
  await attendreHydratation(page)
  await expect(page.getByText('2 cartes rangées.')).toBeVisible()

  const reponse = reponseWishlist(page, 'DELETE')
  await page
    .getByRole('button', { name: 'Retirer Pikachu des favoris' })
    .click()
  expect((await reponse).status()).toBe(200)

  await expect(
    page.getByRole('link', { name: 'Pikachu', exact: true }),
  ).toBeHidden()
  await expect(
    page.getByRole('link', { name: 'Charmander', exact: true }),
  ).toBeVisible()
  expect(await lireWishlist(request)).toEqual([4])
})

test('le classeur refuse un 7e Pokémon', async ({ page, request }) => {
  await ajouterViaApi(request, [1, 2, 3, 4, 5, 6])
  await page.goto('/pokemon/7')
  await attendreHydratation(page)

  const reponse = reponseWishlist(page, 'POST')
  const bouton = page.getByRole('button', { name: '☆ Ajouter au classeur' })
  await bouton.click()
  const res = await reponse

  expect(res.status()).toBe(400)
  expect(await res.json()).toEqual({ erreur: 'Wishlist pleine (6 max)' })
  await expect(bouton).toHaveAttribute('aria-pressed', 'false')
  expect(await lireWishlist(request)).toEqual([1, 2, 3, 4, 5, 6])
})
