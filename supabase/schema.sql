-- Bibliothèque perso Recettes & Exercices — schéma initial (v1)
-- À exécuter dans l'éditeur SQL du projet Supabase.

create extension if not exists "pgcrypto";

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  instagram_link text,
  ingredients text,
  steps text,
  tags text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  instagram_link text,
  muscles text[] not null default '{}',
  description text,
  tags text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists recipes_tags_idx on recipes using gin (tags);
create index if not exists exercises_tags_idx on exercises using gin (tags);

alter table recipes enable row level security;
alter table exercises enable row level security;

-- v1 = outil perso mono-utilisateur, pas d'auth : on autorise tout via la clé anon.
-- À restreindre (ex: policies sur auth.uid()) si un jour on ajoute de l'auth multi-utilisateur.
create policy "Allow all on recipes" on recipes for all using (true) with check (true);
create policy "Allow all on exercises" on exercises for all using (true) with check (true);
