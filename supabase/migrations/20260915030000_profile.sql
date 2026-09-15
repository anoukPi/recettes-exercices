-- Migration 007 — profil personnel pour calculer les besoins journaliers

create table if not exists profile (
  id text primary key default 'me',
  sex text check (sex in ('homme', 'femme')),
  birth_date date,
  height_cm numeric,
  weight_kg numeric,
  activity_level text check (activity_level in ('sedentaire', 'leger', 'modere', 'actif', 'tres_actif')),
  goal text check (goal in ('perte', 'maintien', 'prise')),
  updated_at timestamptz not null default now()
);

alter table profile enable row level security;

drop policy if exists "Allow all on profile" on profile;
create policy "Allow all on profile" on profile for all using (true) with check (true);
