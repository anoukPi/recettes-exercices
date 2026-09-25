-- Plusieurs profils par compte (ex. les enfants d'Anouk sur son adresse mail).
--
-- Principe : le profil principal garde id = id du compte (auth.uid()) — toutes
-- les données existantes y restent rattachées sans rien réécrire d'autre que
-- la nouvelle colonne profile_id (= user_id). Les profils ajoutés ont leur
-- propre id et le même account_id.
--
-- Compatibilité : profile_id a pour valeur par défaut auth.uid() → une version
-- de l'app qui ne connaît pas encore les profils continue d'écrire dans le
-- profil principal. Aucune ligne n'est supprimée.

-- 1. Table profile ------------------------------------------------------------
alter table public.profile add column if not exists account_id uuid;
alter table public.profile add column if not exists display_name text;
alter table public.profile add column if not exists created_at timestamptz not null default now();

update public.profile set account_id = id where account_id is null;

-- Profil principal pour chaque compte qui n'en avait pas encore (données
-- existantes → il faut un profil auquel les rattacher).
insert into public.profile (id, account_id)
select u.id, u.id from auth.users u
where not exists (select 1 from public.profile p where p.id = u.id);

alter table public.profile alter column account_id set not null;
-- Ancienne version de l'app (upsert sans account_id) : profil du compte connecté.
alter table public.profile alter column account_id set default auth.uid();
alter table public.profile
  add constraint profile_account_id_fkey foreign key (account_id) references auth.users(id) on delete restrict;
-- id n'est plus forcément un id de compte (profils ajoutés).
alter table public.profile drop constraint if exists profile_id_fkey;
alter table public.profile alter column id set default gen_random_uuid();
create index if not exists profile_account_id_idx on public.profile(account_id);

drop policy if exists "Own profile" on public.profile;
create policy "Own account profiles" on public.profile
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

-- Le profil principal ne peut pas changer de compte ni disparaître.
create or replace function public.profile_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.account_id <> old.account_id then
    raise exception 'Un profil ne peut pas changer de compte';
  end if;
  return new;
end;
$$;
drop trigger if exists profile_guard on public.profile;
create trigger profile_guard before update on public.profile
  for each row execute function public.profile_guard();

-- Vrai si le profil appartient au compte connecté.
create or replace function public.owns_profile(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profile p where p.id = pid and p.account_id = auth.uid());
$$;
revoke all on function public.owns_profile(uuid) from public, anon;
grant execute on function public.owns_profile(uuid) to authenticated;

-- 2. profile_id sur les données personnelles ---------------------------------
do $$
declare t text;
begin
  foreach t in array array['journal_entries', 'activity_entries', 'cycle_entries', 'fitness_tests', 'water_entries']
  loop
    execute format('alter table public.%I add column if not exists profile_id uuid', t);
    execute format('update public.%I set profile_id = user_id where profile_id is null', t);
    execute format('alter table public.%I alter column profile_id set default auth.uid()', t);
    execute format('alter table public.%I alter column profile_id set not null', t);
    execute format(
      'alter table public.%I add constraint %I foreign key (profile_id) references public.profile(id) on delete restrict',
      t, t || '_profile_id_fkey');
    execute format('create index if not exists %I on public.%I(profile_id, entry_date)', t || '_profile_date_idx', t);

    -- Même compte ET profil de ce compte.
    execute format('drop policy if exists %I on public.%I', 'Own profiles ' || t, t);
    execute format(
      'create policy %I on public.%I for all using (auth.uid() = user_id and public.owns_profile(profile_id)) '
      || 'with check (auth.uid() = user_id and public.owns_profile(profile_id))',
      'Own profiles ' || t, t);
  end loop;
end $$;

-- Remplacées par les politiques ci-dessus (même règle + profil).
drop policy if exists "Own journal entries" on public.journal_entries;
drop policy if exists "Own activity entries" on public.activity_entries;
drop policy if exists "Own cycle entries" on public.cycle_entries;
drop policy if exists "Own fitness tests" on public.fitness_tests;
drop policy if exists "Own water entries" on public.water_entries;

-- Une date de règles unique par profil (et non plus par compte).
alter table public.cycle_entries drop constraint if exists cycle_entries_user_id_entry_date_key;
alter table public.cycle_entries
  add constraint cycle_entries_profile_id_entry_date_key unique (profile_id, entry_date);

-- 3. Fermer le compte archive tous ses profils (rien n'est effacé).
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $function$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Non connectée';
  end if;

  insert into public.profile (id, account_id, archived_at) values (uid, uid, now())
  on conflict (id) do update set archived_at = now();
  update public.profile set archived_at = coalesce(archived_at, now()) where account_id = uid;

  -- Connexion bloquée (réversible) ; sessions en cours fermées. Aucune donnée
  -- n'est touchée.
  update auth.users set banned_until = 'infinity' where id = uid;
  delete from auth.sessions where user_id = uid;
end;
$function$;
