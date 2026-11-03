// Compare chaque fichier de traduction à en.json, front et back.
// Une clé manquante fait échouer la CI (exit 1) ; une clé en trop n'est qu'un avertissement.
// Node pur, sans dépendance : tourne en CI avant même le pnpm install.
/* eslint-disable no-console -- script CLI : la console est sa sortie */
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

const RACINE = join(import.meta.dirname, '..')
const DOSSIERS = ['i18n/locales', 'api/src/i18n']
const REFERENCE = 'en.json'

// { a: { b: 'x' } } → ['a.b']
function aplatir(objet, prefixe = '') {
  return Object.entries(objet).flatMap(([cle, valeur]) => {
    const chemin = prefixe ? `${prefixe}.${cle}` : cle
    return valeur && typeof valeur === 'object' && !Array.isArray(valeur)
      ? aplatir(valeur, chemin)
      : [chemin]
  })
}

function lireCles(fichier) {
  try {
    return new Set(aplatir(JSON.parse(readFileSync(fichier, 'utf8'))))
  } catch (err) {
    console.error(
      `✖ ${relative(RACINE, fichier)} : JSON illisible (${err.message})`,
    )
    return null
  }
}

let manquantes = 0

for (const dossier of DOSSIERS) {
  const chemin = join(RACINE, dossier)
  const reference = lireCles(join(chemin, REFERENCE))
  if (!reference) {
    manquantes++
    continue
  }

  const fichiers = readdirSync(chemin).filter(
    (f) => f.endsWith('.json') && f !== REFERENCE,
  )

  for (const fichier of fichiers) {
    const nom = `${dossier}/${fichier}`
    const cles = lireCles(join(chemin, fichier))
    if (!cles) {
      manquantes++
      continue
    }

    const absentes = [...reference].filter((c) => !cles.has(c))
    const enTrop = [...cles].filter((c) => !reference.has(c))

    if (absentes.length) {
      manquantes += absentes.length
      console.error(`✖ ${nom} : ${absentes.length} clé(s) manquante(s)`)
      for (const c of absentes) console.error(`    - ${c}`)
    }
    if (enTrop.length) {
      console.warn(
        `⚠ ${nom} : ${enTrop.length} clé(s) absente(s) de ${REFERENCE}`,
      )
      for (const c of enTrop) console.warn(`    + ${c}`)
    }
    if (!absentes.length && !enTrop.length) {
      console.log(`✔ ${nom}`)
    }
  }
}

if (manquantes) {
  console.error(
    `\n${manquantes} erreur(s) de traduction : complète les fichiers ci-dessus.`,
  )
  process.exit(1)
}
console.log('\nToutes les traductions sont complètes.')
