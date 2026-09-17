-- Migration 019 — suivi sportif : profil (sports + niveaux escalade),
-- carnet d'activité (champs escalade, forme/intensité ressenties),
-- séances d'exercices réutilisables (comme les recettes pour les ingrédients).

-- Profil : niveau max déclaré, pertinent seulement si le sport correspondant
-- est coché dans profile.sports (déjà existant, text[]).
alter table profile add column if not exists climbing_route_level text;
alter table profile add column if not exists climbing_boulder_level text;

-- Exercices : média (photo hébergée, vidéo en lien externe YouTube/Instagram).
alter table exercises add column if not exists photo_url text;
alter table exercises add column if not exists video_url text;

-- Séances : une séance = une liste d'exercices avec séries/répétitions/repos
-- prévus, réutilisable — même logique que les ingrédients d'une recette.
create table if not exists workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table workout_sessions enable row level security;

drop policy if exists "Read workout sessions (shared pool)" on workout_sessions;
create policy "Read workout sessions (shared pool)"
  on workout_sessions for select
  using (auth.uid() is not null);

drop policy if exists "Insert own workout sessions" on workout_sessions;
create policy "Insert own workout sessions"
  on workout_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Update own workout sessions" on workout_sessions;
create policy "Update own workout sessions"
  on workout_sessions for update
  using (auth.uid() = user_id);

drop policy if exists "Delete own workout sessions" on workout_sessions;
create policy "Delete own workout sessions"
  on workout_sessions for delete
  using (auth.uid() = user_id);

-- Carnet d'activité : champs spécifiques escalade (voie / bloc) + ressenti
-- universel (forme, intensité perçue, 1 à 5) + référence à la séance faite.
alter table activity_entries add column if not exists felt_form smallint;
alter table activity_entries add column if not exists effort_intensity smallint;
alter table activity_entries add column if not exists climbing_routes_count int;
alter table activity_entries add column if not exists climbing_max_attempted text;
alter table activity_entries add column if not exists climbing_max_sent text;
alter table activity_entries add column if not exists climbing_hardest_color text;
alter table activity_entries add column if not exists climbing_max_color_sends int;
alter table activity_entries add column if not exists climbing_below_max_count int;
alter table activity_entries add column if not exists workout_session_id uuid references workout_sessions(id) on delete set null;

-- Séances d'exercices loguées dans une journée : sets/reps réellement faits,
-- au lieu de repos planifié (informatif au niveau de la séance seulement).
alter table activity_session_exercises add column if not exists rest_seconds int;

-- Bucket de stockage pour les photos d'exercices (même schéma que les photos
-- de recettes).
insert into storage.buckets (id, name, public)
values ('exercise-media', 'exercise-media', true)
on conflict (id) do nothing;

drop policy if exists "Public read exercise media" on storage.objects;
create policy "Public read exercise media"
  on storage.objects for select
  using (bucket_id = 'exercise-media');

drop policy if exists "Allow insert exercise media" on storage.objects;
create policy "Allow insert exercise media"
  on storage.objects for insert
  with check (bucket_id = 'exercise-media');

drop policy if exists "Allow update exercise media" on storage.objects;
create policy "Allow update exercise media"
  on storage.objects for update
  using (bucket_id = 'exercise-media');

drop policy if exists "Allow delete exercise media" on storage.objects;
create policy "Allow delete exercise media"
  on storage.objects for delete
  using (bucket_id = 'exercise-media');
