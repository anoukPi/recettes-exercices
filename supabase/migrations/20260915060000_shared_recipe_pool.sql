-- Migration 009 — pool de recettes/exercices partagé avec droits d'auteur (FR-22, FR-23)
-- Lecture ouverte à toute utilisatrice connectée ; seule l'autrice peut
-- modifier/supprimer sa recette (les autres dupliquent, voir FR-22 consequence).

alter table recipes add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table exercises add column if not exists user_id uuid references auth.users(id) on delete set null;

update recipes
set user_id = (select id from auth.users where email = 'anouk.piola@gmail.com')
where user_id is null;

update exercises
set user_id = (select id from auth.users where email = 'anouk.piola@gmail.com')
where user_id is null;

alter table recipes alter column user_id set not null;
alter table exercises alter column user_id set not null;

drop policy if exists "Allow all on recipes" on recipes;
drop policy if exists "Read shared recipe pool" on recipes;
drop policy if exists "Insert own recipe" on recipes;
drop policy if exists "Update own recipe" on recipes;
drop policy if exists "Delete own recipe" on recipes;
create policy "Read shared recipe pool" on recipes for select using (auth.uid() is not null);
create policy "Insert own recipe" on recipes for insert with check (auth.uid() = user_id);
create policy "Update own recipe" on recipes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Delete own recipe" on recipes for delete using (auth.uid() = user_id);

drop policy if exists "Allow all on exercises" on exercises;
drop policy if exists "Read shared exercise pool" on exercises;
drop policy if exists "Insert own exercise" on exercises;
drop policy if exists "Update own exercise" on exercises;
drop policy if exists "Delete own exercise" on exercises;
create policy "Read shared exercise pool" on exercises for select using (auth.uid() is not null);
create policy "Insert own exercise" on exercises for insert with check (auth.uid() = user_id);
create policy "Update own exercise" on exercises for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Delete own exercise" on exercises for delete using (auth.uid() = user_id);
