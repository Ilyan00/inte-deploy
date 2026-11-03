// CLI : pnpm --filter api db:migrate
import { existsSync } from 'node:fs'
import postgres from 'postgres'
import { migrer } from './migrations'

// En local l'URL est dans api/.env ; en CI elle vient des secrets GitHub.
if (existsSync('.env')) process.loadEnvFile('.env')

// Sortie CLI voulue : on écrit sur stdout/stderr plutôt que via console (interdit par le lint).
const afficher = (texte: string) => process.stdout.write(`${texte}\n`)
const erreur = (texte: string) => process.stderr.write(`${texte}\n`)

const { DATABASE_URL } = process.env
if (!DATABASE_URL) {
  erreur('DATABASE_URL est requis (voir api/.env.example)')
  process.exit(1)
}

// Les "if not exists" génèrent des notices Postgres sans intérêt ici.
const sql = postgres(DATABASE_URL, { max: 1, onnotice: () => {} })

try {
  const appliquees = await migrer(sql)
  if (appliquees.length === 0) {
    afficher('Base à jour, aucune migration à appliquer.')
  }
  for (const m of appliquees) afficher(`✔ ${m.version}_${m.nom}`)
} catch (e) {
  erreur(`✘ Migration échouée : ${(e as Error).message}`)
  process.exitCode = 1
} finally {
  await sql.end()
}
