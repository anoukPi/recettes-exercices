-- Migration 017 — tests réguliers (pesée mensuelle, force, endurance...)

create table if not exists fitness_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  test_name text not null,
  value numeric not null,
  unit text not null,
  created_at timestamptz not null default now()
);

create index if not exists fitness_tests_user_name_idx on fitness_tests (user_id, test_name, entry_date);

alter table fitness_tests enable row level security;

drop policy if exists "Own fitness tests" on fitness_tests;
create policy "Own fitness tests" on fitness_tests for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
