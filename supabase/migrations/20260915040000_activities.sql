-- Migration 007 — carnet d'activité physique (FR-30 à FR-32)

create table if not exists activity_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  activity_type text not null,
  duration_minutes numeric not null check (duration_minutes > 0),
  met numeric not null,
  calories_kcal numeric not null,
  -- Prépare le passage multi-utilisatrices (PRD FR-20 à 27) sans réécriture :
  -- nullable tant qu'il n'y a pas d'auth réelle.
  user_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists activity_entries_date_idx on activity_entries (entry_date);

alter table activity_entries enable row level security;

drop policy if exists "Allow all on activity_entries" on activity_entries;
create policy "Allow all on activity_entries" on activity_entries for all using (true) with check (true);
