-- Migration 008 — cloisonnement des données privées par utilisatrice (FR-21)
-- Rattache carnet alimentaire, carnet d'activité et profil au compte
-- d'Anouk (déjà créé via l'authentification), puis verrouille l'accès
-- avec de vraies policies RLS basées sur auth.uid().

-- 1. journal_entries : ajoute et remplit user_id
alter table journal_entries add column if not exists user_id uuid references auth.users(id) on delete cascade;

update journal_entries
set user_id = (select id from auth.users where email = 'anouk.piola@gmail.com')
where user_id is null;

alter table journal_entries alter column user_id set not null;

drop policy if exists "Allow all on journal_entries" on journal_entries;
create policy "Own journal entries" on journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. activity_entries : remplit user_id (colonne déjà existante, nullable)
update activity_entries
set user_id = (select id from auth.users where email = 'anouk.piola@gmail.com')
where user_id is null;

alter table activity_entries alter column user_id set not null;
alter table activity_entries add constraint activity_entries_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

drop policy if exists "Allow all on activity_entries" on activity_entries;
create policy "Own activity entries" on activity_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. profile : transforme la ligne unique id='me' en ligne rattachée au vrai compte
alter table profile alter column id drop default;

update profile
set id = (select id::text from auth.users where email = 'anouk.piola@gmail.com')
where id = 'me';

alter table profile alter column id type uuid using id::uuid;
alter table profile add constraint profile_id_fkey foreign key (id) references auth.users(id) on delete cascade;

drop policy if exists "Allow all on profile" on profile;
create policy "Own profile" on profile
  for all using (auth.uid() = id) with check (auth.uid() = id);
