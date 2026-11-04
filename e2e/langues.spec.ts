import { expect, test } from '@playwright/test'
import {
  ajouterViaApi,
  attendreHydratation,
  reponseWishlist,
  viderWishlist,
} from './outils'

test.beforeEach(async ({ request }) => {
  await viderWishlist(request)
})

test('passer en anglais via le sélecteur, puis s’en souvenir', async ({
  page,
  context,
}) => {
  await page.goto('/')
  await attendreHydratation(page)
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr-FR')

  await page.getByRole('combobox', { name: 'Langue' }).selectOption('en')

  await expect(page).toHaveURL('/en')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    "Gotta catch 'em all",
  )
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')

  const cookies = await context.cookies()
  expect(cookies.find((c) => c.name === 'i18n_langue')?.value).toBe('en')

  // redirectOn: 'root' : revenir sur / renvoie vers la langue retenue
  await page.goto('/')
  await expect(page).toHaveURL('/en')
})

test.describe('navigateur en espagnol', () => {
  test.use({ locale: 'es-ES' })

  test('première visite redirigée vers /es', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL('/es')
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-ES')
  })
})

test('la fiche est traduite', async ({ page }) => {
  await page.goto('/en/pokemon/25')

  await expect(page.locator('.fiche__types')).toHaveText('Electric')
  await expect(page.getByText('No. 0025', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('button', { name: '☆ Add to binder' }),
  ).toBeVisible()
})

test('l’API répond dans la langue du front', async ({ page, request }) => {
  await ajouterViaApi(request, [1, 2, 3, 4, 5, 6])
  await page.goto('/en/pokemon/7')
  await attendreHydratation(page)

  const reponse = reponseWishlist(page, 'POST')
  await page.getByRole('button', { name: '☆ Add to binder' }).click()
  const res = await reponse

  // Le front transmet sa langue en Accept-Language, l'API traduit son erreur
  expect(res.status()).toBe(400)
  expect(await res.json()).toEqual({ erreur: 'Wishlist is full (6 max)' })
})
