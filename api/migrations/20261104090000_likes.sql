-- Likes : un compteur par Pokémon, indépendant de la wishlist.
-- Nouvelle table plutôt qu'une colonne sur wishlist : on peut liker un Pokémon
-- qu'on n'a pas dans son classeur, et la table existante n'est pas touchée.

create table if not exists public.likes (
  pokemon_id integer primary key check (pokemon_id >= 1),
  total integer not null default 0 check (total >= 0)
);

alter table public.likes enable row level security;

-- Lecture libre ; l'écriture ne passe que par liker() ci-dessous.
drop policy if exists "likes lecture" on public.likes;
create policy "likes lecture" on public.likes
  for select to anon, authenticated using (true);

-- Incrément atomique côté base : avec un « lire puis écrire » depuis l'API,
-- deux clics simultanés compteraient pour un seul like.
-- security definer : la clé publishable n'a aucun droit d'écriture direct sur la table.
create or replace function public.liker(p_pokemon_id integer)
returns integer
language sql
security definer
set search_path = ''
as $$
  insert into public.likes (pokemon_id, total)
  values (p_pokemon_id, 1)
  on conflict (pokemon_id) do update set total = public.likes.total + 1
  returning total;
$$;

revoke execute on function public.liker(integer) from public;
grant execute on function public.liker(integer) to anon, authenticated;
