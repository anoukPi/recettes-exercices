-- Migration 027 — aucune donnée de compte n'est jamais effacée (décision
-- d'Anouk, 25/09/2026).
--
-- 1. « Supprimer mon compte » archive au lieu d'effacer : le compte est
--    désactivé (connexion bloquée) et marqué archivé ; toutes ses données
--    restent en base. Le nom de la fonction est conservé pour que la version
--    déjà en ligne de l'app archive aussi, sans attendre son déploiement.
-- 2. Les liens vers auth.users passent de ON DELETE CASCADE / SET NULL à
--    RESTRICT : supprimer un utilisateur (même depuis le tableau de bord
--    Supabase) est refusé tant qu'il a des données, au lieu de tout effacer.
--
-- Réactiver un compte archivé (à la main, SQL Editor) :
--   update auth.users set banned_until = null where email = '...';
--   update public.profile set archived_at = null where id = (select id from auth.users where email = '...');

alter table profile add column if not exists archived_at timestamptz;

-- 2. Plus d'effacement en cascade
alter table journal_entries drop constraint if exists journal_entries_user_id_fkey,
  add constraint journal_entries_user_id_fkey foreign key (user_id) references auth.users(id) on delete restrict;
alter table activity_entries drop constraint if exists activity_entries_user_id_fkey,
  add constraint activity_entries_user_id_fkey foreign key (user_id) references auth.users(id) on delete restrict;
alter table profile drop constraint if exists profile_id_fkey,
  add constraint profile_id_fkey foreign key (id) references auth.users(id) on delete restrict;
alter table cycle_entries drop constraint if exists cycle_entries_user_id_fkey,
  add constraint cycle_entries_user_id_fkey foreign key (user_id) references auth.users(id) on delete restrict;
alter table recipe_endorsements drop constraint if exists recipe_endorsements_user_id_fkey,
  add constraint recipe_endorsements_user_id_fkey foreign key (user_id) references auth.users(id) on delete restrict;
alter table fitness_tests drop constraint if exists fitness_tests_user_id_fkey,
  add constraint fitness_tests_user_id_fkey foreign key (user_id) references auth.users(id) on delete restrict;
alter table water_entries drop constraint if exists water_entries_user_id_fkey,
  add constraint water_entries_user_id_fkey foreign key (user_id) references auth.users(id) on delete restrict;
alter table workout_sessions drop constraint if exists workout_sessions_user_id_fkey,
  add constraint workout_sessions_user_id_fkey foreign key (user_id) references auth.users(id) on delete restrict;
alter table recipes drop constraint if exists recipes_user_id_fkey,
  add constraint recipes_user_id_fkey foreign key (user_id) references auth.users(id) on delete restrict;
alter table exercises drop constraint if exists exercises_user_id_fkey,
  add constraint exercises_user_id_fkey foreign key (user_id) references auth.users(id) on delete restrict;

-- 1. Archiver au lieu d'effacer
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Non connectée';
  end if;

  insert into public.profile (id, archived_at) values (uid, now())
  on conflict (id) do update set archived_at = now();

  -- Connexion bloquée (réversible, voir en tête de fichier) ; sessions en
  -- cours fermées. Aucune donnée de l'utilisatrice n'est touchée.
  update auth.users set banned_until = 'infinity' where id = uid;
  delete from auth.sessions where user_id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
