import { configDefaults, defineConfig } from 'vitest/config'

// L'API a ses propres tests et sa propre CI (.github/workflows/api.yml) :
// on les exclut ici pour ne pas les lancer deux fois. Les E2E (e2e/) passent par Playwright ;
// .vercel/ contient la sortie d'un `vercel build` local, pas des tests.
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'api/**', 'e2e/**', '.vercel/**'],
    coverage: {
      provider: 'v8',
      // json-summary sert au badge (scripts/badge-couverture.mjs), html au rapport publié
      reporter: ['text', 'html', 'json-summary'],
      // Le code TS du front, testé ou non : un fichier sans test compte à 0 %.
      // Les .vue sont couverts par les E2E, pas par Vitest.
      include: ['app/**/*.ts', 'shared/**/*.ts'],
    },
  },
})
