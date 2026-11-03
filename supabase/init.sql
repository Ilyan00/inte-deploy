-- Wishlist Pokémon : une seule liste partagée (pas encore d'utilisateurs).
-- Les règles métier (6 max, id valide) restent dans l'API (api/src/wishlist.ts) ;
-- la base ne garde que les garde-fous structurels.

create table if not exists public.wishlist (
  -- La PK empêche les doublons même si deux requêtes arrivent en même temps.
  pokemon_id integer primary key check (pokemon_id >= 1),
  ajoute_le timestamptz not null default now()
);

-- Supabase expose les tables publiques via l'API REST : sans RLS, tout est ouvert.
alter table public.wishlist enable row level security;

-- L'API utilise la clé publishable (rôle anon) : on l'autorise à lire, ajouter et retirer.
-- Pas d'update : un item se supprime puis se rajoute.
drop policy if exists "wishlist lecture" on public.wishlist;
create policy "wishlist lecture" on public.wishlist
  for select to anon, authenticated using (true);

drop policy if exists "wishlist ajout" on public.wishlist;
create policy "wishlist ajout" on public.wishlist
  for insert to anon, authenticated with check (true);

drop policy if exists "wishlist suppression" on public.wishlist;
create policy "wishlist suppression" on public.wishlist
  for delete to anon, authenticated using (true);
