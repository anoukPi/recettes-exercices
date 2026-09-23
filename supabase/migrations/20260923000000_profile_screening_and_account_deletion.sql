-- Migration 024 — garde-fous avant ouverture aux amies
-- 1. Situation particulière (grossesse/allaitement) : la formule de Mifflin-St
--    Jeor ne s'applique pas, l'app n'affiche alors pas d'objectifs chiffrés.
-- 2. Suppression de compte par l'utilisatrice elle-même. Ses données privées
--    partent en cascade ; ses recettes/exercices restent dans le pool partagé,
--    anonymisés (user_id null), car d'autres carnets peuvent y faire référence.
--    Plus personne ne peut alors les modifier ni les supprimer (RLS sur auth.uid()).

alter table profile add column if not exists special_situation text
  check (special_situation in ('enceinte', 'allaitante'));

alter table recipes alter column user_id drop not null;
alter table exercises alter column user_id drop not null;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Non connectée';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
