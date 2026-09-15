-- Migration 010 — signal de confiance "j'ai testé" sur une recette (FR-27)

create table if not exists recipe_endorsements (
  recipe_id uuid not null references recipes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (recipe_id, user_id)
);

alter table recipe_endorsements enable row level security;

drop policy if exists "Read endorsements" on recipe_endorsements;
create policy "Read endorsements" on recipe_endorsements for select using (auth.uid() is not null);

drop policy if exists "Insert own endorsement" on recipe_endorsements;
create policy "Insert own endorsement" on recipe_endorsements for insert with check (auth.uid() = user_id);

drop policy if exists "Delete own endorsement" on recipe_endorsements;
create policy "Delete own endorsement" on recipe_endorsements for delete using (auth.uid() = user_id);
