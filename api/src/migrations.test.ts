import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import postgres from 'postgres'
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  DOSSIER_MIGRATIONS,
  ErreurMigration,
  lireMigrations,
  migrationsEnAttente,
  migrer,
  type Migration,
} from './migrations'

const migration = (version: string, checksum = 'abc'): Migration => ({
  version,
  nom: 'test',
  sql: '',
  checksum,
})

describe('migrationsEnAttente', () => {
  it('renvoie celles qui ne sont pas encore appliquées, dans l’ordre', () => {
    const locales = [migration('1'), migration('2'), migration('3')]
    const attente = migrationsEnAttente(locales, [
      { version: '1', checksum: 'abc' },
    ])
    expect(attente.map((m) => m.version)).toEqual(['2', '3'])
  })

  it('refuse une migration modifiée après application', () => {
    expect(() =>
      migrationsEnAttente(
        [migration('1', 'nouveau')],
        [{ version: '1', checksum: 'ancien' }],
      ),
    ).toThrow(/modifiée après application/)
  })

  it('refuse une migration appliquée mais supprimée du dossier', () => {
    expect(() =>
      migrationsEnAttente([], [{ version: '1', checksum: 'abc' }]),
    ).toThrow(/plus dans le dossier/)
  })
})

describe('lireMigrations', () => {
  let dossier: string
  beforeEach(() => {
    dossier = mkdtempSync(join(tmpdir(), 'migrations-'))
  })
  afterEach(() => rmSync(dossier, { recursive: true }))

  it('trie par version et ignore les fichiers non SQL', () => {
    writeFileSync(join(dossier, '20260102000000_b.sql'), 'select 2;')
    writeFileSync(join(dossier, '20260101000000_a.sql'), 'select 1;')
    writeFileSync(join(dossier, 'README.md'), '')
    const migrations = lireMigrations(dossier)
    expect(migrations.map((m) => m.nom)).toEqual(['a', 'b'])
    expect(migrations[0]!.checksum).toMatch(/^[0-9a-f]{64}$/)
  })

  it('refuse un fichier SQL mal nommé', () => {
    writeFileSync(join(dossier, 'wishlist.sql'), '')
    expect(() => lireMigrations(dossier)).toThrow(ErreurMigration)
  })
})

// Mêmes garde-fous que app.test.ts : jamais contre autre chose que le Postgres local.
describe('migrer (Postgres local)', () => {
  const url = process.env.DATABASE_URL ?? ''
  if (!/@(127\.0\.0\.1|localhost)[:/]/.test(url)) {
    throw new Error(`Tests refusés hors BDD locale : ${url}`)
  }
  const sql = postgres(url, { max: 1, onnotice: () => {} })
  afterAll(() => sql.end())

  it('est idempotent : un second passage n’applique rien', async () => {
    await migrer(sql)
    expect(await migrer(sql)).toEqual([])

    const lignes = await sql`select version from public.schema_migrations`
    const versions = lignes.map((l) => l.version)
    for (const m of lireMigrations(DOSSIER_MIGRATIONS)) {
      expect(versions).toContain(m.version)
    }
  })

  it('annule une migration qui échoue, schéma et suivi compris', async () => {
    const dossier = mkdtempSync(join(tmpdir(), 'migrations-'))
    try {
      // Le dossier doit contenir les vraies migrations, sinon le garde-fou "supprimée" saute.
      for (const m of lireMigrations(DOSSIER_MIGRATIONS)) {
        const fichier = `${m.version}_${m.nom}.sql`
        copyFileSync(join(DOSSIER_MIGRATIONS, fichier), join(dossier, fichier))
      }
      writeFileSync(
        join(dossier, '99991231235959_cassee.sql'),
        'create table public.test_rollback (id int); select 1 / 0;',
      )

      await expect(migrer(sql, dossier)).rejects.toThrow(/division by zero/)

      const [{ existe }] = await sql`
        select to_regclass('public.test_rollback') is not null as existe
      `
      expect(existe).toBe(false)
      const suivi = await sql`
        select 1 from public.schema_migrations where version = '99991231235959'
      `
      expect(suivi).toHaveLength(0)
    } finally {
      rmSync(dossier, { recursive: true })
    }
  })
})
