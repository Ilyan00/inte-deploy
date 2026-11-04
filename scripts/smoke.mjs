// Smoke tests de prod, lancés juste après chaque déploiement (et à la main si besoin).
// Vérifie les URLs critiques et le HTML brut des fiches, sans exécuter de JavaScript :
// c'est ce que voit un robot d'indexation. Une seule erreur = exit 1 = job CD rouge.
//
// Chaque cible est optionnelle, on ne teste que ce qu'on vient de déployer :
//   API_URL=https://xxx.execute-api.eu-west-3.amazonaws.com   (Lambda)
//   SSR_URL=https://xxx.vercel.app                             (Nuxt SSR, Vercel)
//   SSG_URL=https://xxx.cloudfront.net                         (Nuxt statique, S3)
// Si SSR_URL et SSG_URL sont données toutes les deux, on compare aussi leur HTML.

const { API_URL, SSR_URL, SSG_URL } = process.env
const sansSlash = (url) => url?.replace(/\/+$/, '')

// Pikachu : pré-rendu au build, donc présent dans les deux modes.
const FICHE = { chemin: '/pokemon/25', nom: 'Pikachu', type: 'Électrik' }
const ESSAIS = 3

const echecs = []
const ok = (texte) => process.stdout.write(`  ✔ ${texte}\n`)
const ko = (texte) => {
  echecs.push(texte)
  process.stdout.write(`  ✘ ${texte}\n`)
}

// Juste après un deploy, un CDN ou une Lambda froide peut répondre lentement : on réessaie.
async function recuperer(url) {
  for (let essai = 1; ; essai++) {
    try {
      const res = await fetch(url, {
        redirect: 'manual',
        // Page en français : c'est la langue par défaut, sans préfixe d'URL
        headers: { 'Accept-Language': 'fr-FR' },
        signal: AbortSignal.timeout(10_000),
      })
      return { statut: res.status, corps: await res.text() }
    } catch (err) {
      if (essai >= ESSAIS) return { statut: 0, corps: '', erreur: err.message }
      await new Promise((r) => setTimeout(r, 3000 * essai))
    }
  }
}

async function attendreStatut(url, attendu) {
  const res = await recuperer(url)
  if (res.statut === attendu) ok(`${url} → ${res.statut}`)
  else ko(`${url} → ${res.statut || res.erreur} (attendu ${attendu})`)
  return res
}

// Extraction volontairement simple : on cherche des balises précises, pas un parseur HTML.
const extraire = (html, regex) =>
  regex
    .exec(html)?.[1]
    ?.replace(/<[^>]+>/g, '')
    .trim() ?? null

function lireSeo(html) {
  return {
    title: extraire(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    h1: extraire(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i),
    description: extraire(
      html,
      /<meta[^>]+name="description"[^>]+content="([^"]*)"/i,
    ),
  }
}

async function verifierApi(base) {
  process.stdout.write(`\nAPI · ${base}\n`)
  const sante = await attendreStatut(`${base}/health`, 200)
  if (sante.statut === 200 && !sante.corps.includes('"ok"')) {
    ko('/health ne renvoie pas { status: "ok" }')
  }
  await attendreStatut(`${base}/wishlist`, 200)
  await attendreStatut(`${base}/likes/25`, 200)
  await attendreStatut(`${base}/route-qui-nexiste-pas`, 404)
}

async function verifierFront(nomMode, base) {
  process.stdout.write(`\n${nomMode} · ${base}\n`)
  await attendreStatut(`${base}/`, 200)

  const fiche = await attendreStatut(`${base}${FICHE.chemin}`, 200)
  const seo = lireSeo(fiche.corps)
  // Une coquille SPA n'a ni h1 ni contenu : seul le JS les ajouterait.
  if (seo.title === `${FICHE.nom} · PokéGang`) ok(`title « ${seo.title} »`)
  else
    ko(
      `${nomMode} : title « ${seo.title} » (attendu « ${FICHE.nom} · PokéGang »)`,
    )
  if (seo.h1 === FICHE.nom) ok(`h1 « ${seo.h1} » présent dans le HTML`)
  else ko(`${nomMode} : h1 « ${seo.h1} » absent ou faux, page vide sans JS ?`)
  if (fiche.corps.includes(FICHE.type))
    ok(`type « ${FICHE.type} » dans le HTML`)
  else ko(`${nomMode} : le contenu de la fiche n'est pas dans le HTML`)
  if (seo.description) ok('meta description présente')
  else ko(`${nomMode} : meta description absente`)

  await attendreStatut(`${base}/pokemon/pokemon-qui-nexiste-pas`, 404)
  return seo
}

if (!API_URL && !SSR_URL && !SSG_URL) {
  process.stderr.write('Donne au moins API_URL, SSR_URL ou SSG_URL\n')
  process.exit(1)
}

if (API_URL) await verifierApi(sansSlash(API_URL))
const seoSsr = SSR_URL && (await verifierFront('SSR', sansSlash(SSR_URL)))
const seoSsg = SSG_URL && (await verifierFront('SSG', sansSlash(SSG_URL)))

// Même code, même contenu : un robot doit lire la même fiche quel que soit l'hébergement.
if (seoSsr && seoSsg) {
  process.stdout.write('\nSSR vs SSG\n')
  for (const champ of ['title', 'h1', 'description']) {
    if (seoSsr[champ] === seoSsg[champ]) ok(`${champ} identique`)
    else
      ko(
        `${champ} différent : SSR « ${seoSsr[champ]} » / SSG « ${seoSsg[champ]} »`,
      )
  }
}

if (echecs.length) {
  process.stderr.write(`\n${echecs.length} vérification(s) en échec\n`)
  process.exit(1)
}
process.stdout.write('\nTout répond.\n')
