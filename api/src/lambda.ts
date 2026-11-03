import { handle } from 'hono/aws-lambda'
import { creerApp } from './app'
import { creerClientSupabase } from './bdd'

// Créé hors du handler : réutilisé tant que la Lambda reste chaude.
// Les variables viennent de la config de la fonction, pas d'un .env.
const app = creerApp(creerClientSupabase())

export const handler = handle(app)
