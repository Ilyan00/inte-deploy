import { existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'

// Vitest ne charge pas le .env tout seul ; en CI les variables viennent des secrets.
if (existsSync('.env')) process.loadEnvFile('.env')

const { SUPABASE_URL, SUPABASE_KEY } = process.env

// Sans identifiants (CI sans secrets, poste neuf), on saute plutôt que d'échouer.
describe.skipIf(!SUPABASE_URL || !SUPABASE_KEY)('Connexion Supabase', () => {
  it('lit la table wishlist sans erreur', async () => {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!)

    const { error, status } = await supabase
      .from('wishlist')
      .select('pokemon_id')
      .limit(1)

    expect(error).toBeNull()
    expect(status).toBe(200)
  })
})
