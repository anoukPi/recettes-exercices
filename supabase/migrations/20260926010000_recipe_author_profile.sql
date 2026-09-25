-- Profil qui a ajouté la recette (toi, un enfant…) — pour l'afficher sur la
-- carte et filtrer « Les miennes » par profil. Les recettes existantes sont
-- rattachées au profil principal de leur compte (id = user_id). Nullable :
-- une ancienne version de l'app qui ne l'envoie pas garde le comportement
-- actuel. Rien n'est supprimé.
alter table public.recipes add column if not exists profile_id uuid references public.profile(id) on delete restrict;

update public.recipes r set profile_id = r.user_id
where r.profile_id is null and exists (select 1 from public.profile p where p.id = r.user_id);

-- Le profil indiqué doit appartenir au compte de l'autrice.
drop policy if exists "Insert own recipe" on public.recipes;
create policy "Insert own recipe" on public.recipes
  for insert with check (auth.uid() = user_id and (profile_id is null or public.owns_profile(profile_id)));
drop policy if exists "Update own recipe" on public.recipes;
create policy "Update own recipe" on public.recipes
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id and (profile_id is null or public.owns_profile(profile_id)));

-- Demande d'Anouk (25/09/2026) : le Bircher a été ajouté depuis le profil d'Elia.
update public.recipes set profile_id = '0cf96962-8a58-44fb-a728-f921c6a37f2f'
where id = '891e1bb4-c9c4-4b58-81fa-0bb10435c022';
