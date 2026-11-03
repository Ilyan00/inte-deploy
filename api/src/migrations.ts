import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Sql } from 'postgres'

export const DOSSIER_MIGRATIONS = fileURLToPath(
  new URL('../migrations', import.meta.url),
)

// Horodatage à 14 chiffres : l'ordre alphabétique est aussi l'ordre chronologique.
const FORMAT_FICHIER = /^(\d{14})_([a-z0-9_]+)\.sql$/

// Clé arbitraire mais fixe : tous les runners doivent se battre pour le même verrou.
const VERROU_MIGRATIONS = 727_001

export type Migration = {
  version: string
  nom: string
  sql: string
  checksum: string
}

export type MigrationAppliquee = { version: string; checksum: string }

export class ErreurMigration extends Error {}

export function lireMigrations(dossier: string): Migration[] {
  return readdirSync(dossier)
    .filter((fichier) => fichier.endsWith('.sql'))
    .sort()
    .map((fichier) => {
      const match = FORMAT_FICHIER.exec(fichier)
      // Un fichier mal nommé serait ignoré sans bruit : on préfère planter.
      if (!match) {
        throw new ErreurMigration(
          `Nom de migration invalide : ${fichier} (attendu AAAAMMJJHHMMSS_nom.sql)`,
        )
      }
      const sql = readFileSync(join(dossier, fichier), 'utf8')
      return {
        version: match[1]!,
        nom: match[2]!,
        sql,
        checksum: createHash('sha256').update(sql).digest('hex'),
      }
    })
}

// Logique pure, séparée de la BDD pour être testable sans Postgres.
export function migrationsEnAttente(
  locales: Migration[],
  appliquees: MigrationAppliquee[],
): Migration[] {
  const parVersion = new Map(locales.map((m) => [m.version, m]))

  for (const appliquee of appliquees) {
    const locale = parVersion.get(appliquee.version)
    if (!locale) {
      throw new ErreurMigration(
        `La migration ${appliquee.version} est en base mais plus dans le dossier`,
      )
    }
    // Modifier une migration déjà jouée ne la rejoue pas : la base et le code divergeraient.
    if (locale.checksum !== appliquee.checksum) {
      throw new ErreurMigration(
        `La migration ${locale.version}_${locale.nom} a été modifiée après application : crée une nouvelle migration`,
      )
    }
  }

  const dejaFaites = new Set(appliquees.map((m) => m.version))
  return locales.filter((m) => !dejaFaites.has(m.version))
}

// Le client doit avoir max: 1 : le verrou advisory est lié à la connexion qui l'a pris.
export async function migrer(
  sql: Sql,
  dossier = DOSSIER_MIGRATIONS,
): Promise<Migration[]> {
  // Deux déploiements simultanés : le second attend que le premier ait fini.
  await sql`select pg_advisory_lock(${VERROU_MIGRATIONS})`
  try {
    // RLS sans policy : invisible pour la clé publishable via l'API REST de Supabase.
    await sql`
      create table if not exists public.schema_migrations (
        version text primary key,
        nom text not null,
        checksum text not null,
        applique_le timestamptz not null default now()
      );
      alter table public.schema_migrations enable row level security;
    `.simple()

    const appliquees = await sql<MigrationAppliquee[]>`
      select version, checksum from public.schema_migrations
    `
    const enAttente = migrationsEnAttente(lireMigrations(dossier), appliquees)

    // Une transaction par migration : si elle échoue, ni le schéma ni le suivi ne bougent.
    for (const migration of enAttente) {
      await sql.begin(async (tx) => {
        await tx.unsafe(migration.sql).simple()
        await tx`
          insert into public.schema_migrations (version, nom, checksum)
          values (${migration.version}, ${migration.nom}, ${migration.checksum})
        `
      })
    }
    return enAttente
  } finally {
    await sql`select pg_advisory_unlock(${VERROU_MIGRATIONS})`
  }
}
