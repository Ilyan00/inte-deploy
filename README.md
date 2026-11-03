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
