import { expect, test } from '@playwright/test'
import { attendreHydratation } from './outils'

test('de la recherche à la fiche de Pikachu', async ({ page }) => {
  await page.goto('/')
  await attendreHydratation(page)

  await page.getByRole('searchbox').fill('pikachu')
  await expect(page.getByText('1 Pokémon', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Pikachu', exact: true }).click()

  await expect(page).toHaveURL('/pokemon/25')
  await expect(page).toHaveTitle('Pikachu · PokéGang')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pikachu')
  await expect(page.getByText('N° 0025', { exact: true })).toBeVisible()
  await expect(page.locator('.fiche__types')).toHaveText('Électrik')
  // 35 + 55 + 40 + 50 + 50 + 90
  await expect(page.locator('.fiche__total dd')).toHaveText('320')
})

test('navigation entre Pokémon voisins', async ({ page }) => {
  await page.goto('/pokemon/25')
  await attendreHydratation(page)

  await page.getByRole('link', { name: /N° 0026/ }).click()
  await expect(page).toHaveURL('/pokemon/26')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Raichu')

  await page.getByRole('link', { name: /N° 0025/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pikachu')
})

test('le premier Pokémon n’a pas de précédent', async ({ page }) => {
  await page.goto('/pokemon/1')

  const voisins = page.getByRole('navigation', { name: 'Pokémon voisins' })
  await expect(voisins.getByRole('link')).toHaveCount(1)
  await expect(voisins.getByRole('link')).toContainText('N° 0002')
})

test('une fiche s’ouvre aussi par son nom', async ({ page }) => {
  await page.goto('/pokemon/pikachu')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pikachu')
  await expect(page.getByText('N° 0025', { exact: true })).toBeVisible()
})

test('un Pokémon inconnu renvoie une vraie 404', async ({ page }) => {
  const res = await page.goto('/pokemon/nexistepas')

  expect(res?.status()).toBe(404)
  await expect(page.getByText("Ce Pokémon n'existe pas.")).toBeVisible()
})
