import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Les tests visent toujours le Supabase local (pnpm db:start), jamais le .env :
    // ils vident la table, ils ne doivent pas pouvoir toucher la base cloud.
    // Ce sont les valeurs par défaut de la CLI Supabase, identiques sur tous les postes.
    env: {
      SUPABASE_URL: 'http://127.0.0.1:54321',
      SUPABASE_KEY: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
    },
    // Les fichiers partagent la même table : on les lance l'un après l'autre.
    fileParallelism: false,
  },
})
