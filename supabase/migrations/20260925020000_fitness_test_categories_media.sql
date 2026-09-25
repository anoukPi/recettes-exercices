-- Migration 028 — Tests par catégorie (mesures corporelles, force, souplesse,
-- endurance) + photo et vidéo par saisie.
--
-- Les photos/vidéos (corps, posture) sont sensibles : bucket PRIVÉ, chaque
-- utilisatrice ne voit que ses fichiers (dossier = son id), affichés via des
-- URL signées temporaires. Pas de suppression ni de modification possibles
-- (règle d'Anouk : aucune donnée n'est jamais effacée).

alter table fitness_tests add column if not exists category text
  check (category in ('mesures', 'force', 'souplesse', 'endurance'));
alter table fitness_tests add column if not exists photo_path text;
alter table fitness_tests add column if not exists video_path text;

-- Les tests existants (poids…) rejoignent leur catégorie.
update fitness_tests set category = 'mesures'
where category is null and lower(test_name) in ('poids', 'tour de taille', 'tour de hanches');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('test-media', 'test-media', false, 52428800, array['image/*', 'video/*'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Own test media read" on storage.objects;
create policy "Own test media read"
  on storage.objects for select
  using (bucket_id = 'test-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Own test media insert" on storage.objects;
create policy "Own test media insert"
  on storage.objects for insert
  with check (bucket_id = 'test-media' and (storage.foldername(name))[1] = auth.uid()::text);
