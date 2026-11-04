// Transforme un coverage-summary.json (Vitest, reporter json-summary) en badge shields.io
// et ajoute un tableau au résumé du job GitHub Actions.
// Usage : node scripts/badge-couverture.mjs <coverage-summary.json> <libellé> <badge.json>
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const [resume, libelle, sortie] = process.argv.slice(2)
if (!resume || !libelle || !sortie) {
  process.stderr.write(
    'Usage : node scripts/badge-couverture.mjs <summary.json> <libellé> <badge.json>\n',
  )
  process.exit(1)
}

const { total } = JSON.parse(readFileSync(resume, 'utf8'))
// Les lignes : c'est le chiffre que tout le monde lit en premier.
const taux = total.lines.pct

const couleur =
  taux >= 80
    ? 'brightgreen'
    : taux >= 60
      ? 'yellow'
      : taux >= 40
        ? 'orange'
        : 'red'

mkdirSync(dirname(sortie), { recursive: true })
// Format « endpoint » de shields.io : https://shields.io/badges/endpoint-badge
writeFileSync(
  sortie,
  JSON.stringify({
    schemaVersion: 1,
    label: libelle,
    message: `${taux}%`,
    color: couleur,
  }),
)

if (process.env.GITHUB_STEP_SUMMARY) {
  const ligne = (nom, m) => `| ${nom} | ${m.pct}% | ${m.covered}/${m.total} |`
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    [
      `### Couverture — ${libelle}`,
      '',
      '| | Taux | Couvert |',
      '|---|---|---|',
      ligne('Lignes', total.lines),
      ligne('Instructions', total.statements),
      ligne('Branches', total.branches),
      ligne('Fonctions', total.functions),
      '',
      '',
    ].join('\n'),
  )
}

process.stdout.write(`${libelle} : ${taux}% des lignes couvertes\n`)
