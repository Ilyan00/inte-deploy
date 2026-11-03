import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function creerClientSupabase(): SupabaseClient {
  const { SUPABASE_URL, SUPABASE_KEY } = process.env
  // On plante au démarrage plutôt qu'à la première requête.
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      'SUPABASE_URL et SUPABASE_KEY sont requis (voir api/.env.example)',
    )
  }
  // Côté serveur, pas de session utilisateur à garder entre deux appels.
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  })
}
