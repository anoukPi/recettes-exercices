-- Migration 015 — suivi du cycle féminin (dates de règles uniquement)

create table if not exists cycle_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index if not exists cycle_entries_user_date_idx on cycle_entries (user_id, entry_date);

alter table cycle_entries enable row level security;

drop policy if exists "Own cycle entries" on cycle_entries;
create policy "Own cycle entries" on cycle_entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
