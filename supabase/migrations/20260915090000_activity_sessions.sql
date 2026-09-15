-- Migration 012 — séances d'activité détaillées (intensité, type, exercices liés)

alter table activity_entries add column if not exists intensity text
  check (intensity in ('leger', 'modere', 'intense'));
alter table activity_entries add column if not exists training_type text
  check (training_type in ('musculation', 'cardio', 'hiit', 'etirement', 'sport_collectif', 'autre'));

create table if not exists activity_session_exercises (
  id uuid primary key default gen_random_uuid(),
  activity_entry_id uuid not null references activity_entries(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  sets numeric,
  reps numeric,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists activity_session_exercises_entry_idx on activity_session_exercises (activity_entry_id);

alter table activity_session_exercises enable row level security;

drop policy if exists "Own session exercises" on activity_session_exercises;
create policy "Own session exercises" on activity_session_exercises for all
  using (
    exists (
      select 1 from activity_entries a
      where a.id = activity_session_exercises.activity_entry_id and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from activity_entries a
      where a.id = activity_session_exercises.activity_entry_id and a.user_id = auth.uid()
    )
  );
