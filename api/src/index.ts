import { existsSync } from 'node:fs'
import { serve } from '@hono/node-server'
import { creerApp } from './app'
import { creerClientSupabase } from './bdd'

// En local les identifiants sont dans api/.env ; en prod ils viennent de l'hébergeur.
if (existsSync('.env')) process.loadEnvFile('.env')

const app = creerApp(creerClientSupabase())

serve({ fetch: app.fetch, port: Number(process.env.PORT) || 3333 })
