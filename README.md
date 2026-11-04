[![Couverture front](https://img.shields.io/endpoint?url=https://ilyan00.github.io/inte-deploy/badge-front.json)](https://ilyan00.github.io/inte-deploy/front/)
[![Couverture API](https://img.shields.io/endpoint?url=https://ilyan00.github.io/inte-deploy/badge-api.json)](https://ilyan00.github.io/inte-deploy/api/)

# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Migrations BDD (API)

Les migrations SQL sont dans `api/migrations/` et sont appliquées par un runner maison (`api/src/migrations.ts`), qui garde l'historique dans la table `public.schema_migrations`.

```bash
pnpm --filter api db:start    # Postgres local (Docker)
pnpm --filter api db:migrate  # applique les migrations en attente
pnpm --filter api db:reset    # repart d'une base vide, puis migre
```

- **Nommage** : `AAAAMMJJHHMMSS_nom.sql`, par exemple `20261103160000_ajout_equipes.sql`. Un fichier `.sql` mal nommé fait échouer le runner.
- **Une migration appliquée ne se modifie plus** : le runner vérifie un checksum et refuse de continuer s'il a changé. Pour corriger ou annuler, on écrit une nouvelle migration.
- Chaque fichier est exécuté dans une transaction : pas de `begin` / `commit` dedans.
- **Prod** : le job de déploiement (`.github/workflows/api.yml`) lance `db:migrate` avant de mettre à jour la Lambda. Il faut pour ça le secret GitHub `DATABASE_URL`, avec l'URL du _Session pooler_ Supabase (les runners GitHub ne parlent pas IPv6).

## Tests E2E (Playwright)

Les parcours passent par toute la chaîne : navigateur → Nuxt → API Hono → Supabase **local**. Ils sont dans `e2e/` : fiche, langues, persistance de la wishlist et likes.

```bash
pnpm --filter api db:start            # Supabase local (Docker), migré avec db:migrate
pnpm exec playwright install chromium # une seule fois
pnpm test:e2e                         # ou test:e2e:ui pour le mode interactif
```

- Playwright démarre lui-même l'API sur le port **3334** et le front sur le port **3100**, branchés sur la base locale. Ces ports ne sont pas ceux de `pnpm dev`, exprès : les tests vident la wishlist et ne doivent jamais toucher la base cloud.
- Le front E2E compile dans `.nuxt-e2e`, ce qui permet de garder un `pnpm dev` ouvert pendant les tests.
- En CI (job `e2e` de `ci.yml`), on teste le build de prod. Le déploiement Vercel attend que ce job passe.
- Les fiches viennent de la vraie PokéAPI : si elle ne répond pas, les tests échouent.

## Likes

Un compteur par Pokémon, sur la fiche. Table `likes` créée par la migration `api/migrations/20261104090000_likes.sql`.

- `GET /likes/:id` → `{ id, total }` (0 si jamais liké), `POST /likes/:id` → ajoute un like et renvoie le nouveau total.
- L'incrément est fait par la fonction SQL `liker()` : atomique, deux clics simultanés comptent pour deux. La clé publishable n'a aucun droit d'écriture direct sur la table.
- Le compteur est lu **dans le navigateur** (`app/composables/useLikes.ts`) : les fiches sont pré-rendues, un compteur rendu au build resterait figé.

## Couverture des tests

```bash
pnpm test:coverage                 # front → coverage/
pnpm --filter api test:coverage    # API (Supabase local requis) → api/coverage/
```

Le workflow `.github/workflows/couverture.yml` lance les deux, écrit un résumé dans le job et, sur `main`, publie les rapports HTML et les badges sur GitHub Pages.

**À activer une fois** : Settings → Pages → Source : **GitHub Actions**.

Le taux front est bas : les composables Nuxt et les pages `.vue` sont couverts par les E2E Playwright, pas par Vitest.

## Front statique (SSG) sur S3 + CloudFront

Le job `deploiement-ssg` de `ci.yml` lance `pnpm generate`, envoie `.output/public` sur S3 puis invalide CloudFront. Il est **ignoré tant que la variable `S3_BUCKET` n'existe pas**.

Mise en place (console AWS, région `eu-west-3`) :

1. **Bucket S3** privé (accès public bloqué), par exemple `pokegang-ssg`.
2. **Distribution CloudFront** avec ce bucket comme origine, en accès **OAC** (CloudFront ajoute lui-même la policy du bucket).
3. **CloudFront Function** (runtime `cloudfront-js-2.0`) avec le code de `infra/cloudfront-index.js`, associée au comportement par défaut en _viewer request_. Sans elle, `/pokemon/25` ne trouve pas `pokemon/25/index.html`.
4. **Pages d'erreur** de la distribution : 403 et 404 → `/404.html`, code de réponse **404** (S3 privé renvoie 403 pour un fichier absent).
5. **Rôle IAM** utilisé par GitHub (`AWS_ROLE_ARN`) : ajouter `s3:ListBucket` sur le bucket, `s3:PutObject` et `s3:DeleteObject` sur `bucket/*`, `cloudfront:CreateInvalidation` et `cloudfront:GetInvalidation` sur la distribution.
6. **Lambda** : `FRONT_URL` accepte une liste séparée par des virgules, y mettre les deux fronts pour le CORS : `https://inte-deploy.vercel.app,https://xxxx.cloudfront.net`.
7. **Variables GitHub** (Settings → Secrets and variables → Actions → _Variables_) : `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`, `SSG_URL` (`https://xxxx.cloudfront.net`).

Test en local : `pnpm generate`, puis servir `.output/public`.

## Smoke tests et SEO

`scripts/smoke.mjs` vérifie la prod sans navigateur, comme un robot d'indexation : codes HTTP, `/health`, et le HTML brut de la fiche Pikachu (`title`, `h1`, contenu, meta description, vraie 404). Avec SSR et SSG, il compare aussi leur HTML.

```bash
API_URL=https://dwwu5ahtnb.execute-api.eu-west-3.amazonaws.com node scripts/smoke.mjs
SSR_URL=https://inte-deploy.vercel.app SSG_URL=https://xxxx.cloudfront.net node scripts/smoke.mjs
```

Il tourne après chaque déploiement (Lambda, Vercel, SSG) : si une URL critique ne répond pas, le job de CD passe au rouge.

## Rollback

Actions → **Rollback** → _Run workflow_ (`.github/workflows/rollback.yml`) :

| Cible              | `version`                                  | Ce qui se passe                                         |
| ------------------ | ------------------------------------------ | ------------------------------------------------------- |
| `front-ssr-vercel` | URL d'un déploiement (vide = le précédent) | `vercel rollback` : instantané, rien n'est recompilé    |
| `api-lambda`       | SHA ou tag git d'une version stable        | rebuild du zip à ce commit, puis `update-function-code` |
| `front-ssg`        | SHA ou tag git d'une version stable        | `generate` à ce commit, sync S3, invalidation           |

- **Trouver la dernière version stable** : l'onglet Actions (dernier run vert de `CI` / `CI API` sur `main`), ou `vercel ls --prod` pour le front.
- **La base n'est jamais restaurée** : les migrations suivent le principe expand / contract, l'ancien code doit continuer à fonctionner avec le nouveau schéma.
- **Vercel** : après un rollback, les nouveaux déploiements ne prennent plus le domaine de prod tout seuls. Une fois le correctif poussé : `vercel promote <url>` ou « Undo Rollback » dans le dashboard.
