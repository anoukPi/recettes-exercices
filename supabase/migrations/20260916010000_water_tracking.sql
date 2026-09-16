-- Migration 019 — suivi de l'hydratation

create table if not exists water_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  amount_ml numeric not null default 250,
  created_at timestamptz not null default now()
);

create index if not exists water_entries_user_date_idx on water_entries (user_id, entry_date);

alter table water_entries enable row level security;

drop policy if exists "Own water entries" on water_entries;
create policy "Own water entries" on water_entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
