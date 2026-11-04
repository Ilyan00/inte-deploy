import { defineConfig, devices } from '@playwright/test'

import { API_URL, FRONT_URL } from './e2e/outils'

// Valeurs par défaut de la CLI Supabase (pnpm --filter api db:start), identiques partout.
// Passées en variables d'env, elles priment sur api/.env (loadEnvFile n'écrase rien).
const SUPABASE_LOCAL = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_KEY: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
}

const CI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  // Une seule wishlist partagée en base : les tests passent l'un après l'autre.
  workers: 1,
  fullyParallel: false,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: FRONT_URL,
    locale: 'fr-FR',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm --filter api start',
      url: `${API_URL}/health`,
      env: { ...SUPABASE_LOCAL, PORT: '3334', FRONT_URL },
      reuseExistingServer: false,
    },
    {
      // En CI on teste le build de prod (fiches pré-rendues comprises), construit juste avant
      // avec NUXT_PUBLIC_API_URL pointant sur l'API de test. En local, un nuxt dev à part.
      command: CI
        ? 'node .output/server/index.mjs'
        : 'pnpm exec nuxt dev --port 3100',
      url: FRONT_URL,
      env: {
        PORT: '3100',
        NUXT_PUBLIC_API_URL: API_URL,
        // Dossier de build séparé : ne marche pas sur un `pnpm dev` déjà lancé (voir nuxt.config.ts)
        NUXT_E2E: '1',
      },
      reuseExistingServer: false,
      // Premier démarrage de nuxt dev : compilation complète
      timeout: 180_000,
    },
  ],
})
