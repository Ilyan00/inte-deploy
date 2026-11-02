import { configDefaults, defineConfig } from 'vitest/config'

// L'API a ses propres tests et sa propre CI (.github/workflows/api.yml) :
// on les exclut ici pour ne pas les lancer deux fois.
export default defineConfig({
  test: { exclude: [...configDefaults.exclude, 'api/**'] },
})
