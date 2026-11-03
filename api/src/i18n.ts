import en from './i18n/en.json' with { type: 'json' }
import es from './i18n/es.json' with { type: 'json' }
import fr from './i18n/fr.json' with { type: 'json' }
import pt from './i18n/pt.json' with { type: 'json' }

// en.json est la référence vérifiée en CI (scripts/check-i18n.mjs) ;
// fr reste la langue par défaut, comme sur le front.
const TRADUCTIONS = { fr, en, es, pt }

export type Langue = keyof typeof TRADUCTIONS
export const LANGUE_PAR_DEFAUT: Langue = 'fr'

type Messages = typeof en
// « erreurs.idInvalide » : une faute de frappe dans une clé casse le typecheck.
export type CleTraduction = {
  [S in keyof Messages]: `${S}.${keyof Messages[S] & string}`
}[keyof Messages]

export type Params = Record<string, string | number>

const estLangue = (code: string): code is Langue => code in TRADUCTIONS

// « pt-BR,pt;q=0.9,en;q=0.8 » → pt. Les navigateurs envoient déjà les langues
// par préférence décroissante : on garde la première qu'on sait servir.
export function detecterLangue(acceptLanguage: string | undefined): Langue {
  for (const morceau of acceptLanguage?.split(',') ?? []) {
    const code = morceau.split(';')[0]!.trim().split('-')[0]!.toLowerCase()
    if (estLangue(code)) return code
  }
  return LANGUE_PAR_DEFAUT
}

export function t(langue: Langue, cle: CleTraduction, params: Params = {}) {
  const [section, nom] = cle.split('.') as [keyof Messages, string]
  const modele =
    (TRADUCTIONS[langue][section] as Record<string, string>)[nom] ??
    // Filet de sécurité : la CI bloque déjà les clés manquantes
    (en[section] as Record<string, string>)[nom] ??
    cle
  return modele.replace(/\{(\w+)\}/g, (brut, p: string) =>
    p in params ? String(params[p]) : brut,
  )
}
