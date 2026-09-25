-- Stockage : lecture publique conservée (images affichées dans l'app), mais
-- dépôt / remplacement / suppression réservés aux personnes connectées
-- (avant : possible avec la seule clé anon publique).
drop policy if exists "Allow insert recipe photos" on storage.objects;
drop policy if exists "Allow update recipe photos" on storage.objects;
drop policy if exists "Allow delete recipe photos" on storage.objects;
drop policy if exists "Allow insert exercise media" on storage.objects;
drop policy if exists "Allow update exercise media" on storage.objects;
drop policy if exists "Allow delete exercise media" on storage.objects;

create policy "Signed-in insert recipe photos" on storage.objects
  for insert with check (bucket_id = 'recipe-photos' and auth.uid() is not null);
create policy "Signed-in update recipe photos" on storage.objects
  for update using (bucket_id = 'recipe-photos' and auth.uid() is not null);
create policy "Signed-in delete recipe photos" on storage.objects
  for delete using (bucket_id = 'recipe-photos' and auth.uid() is not null);
create policy "Signed-in insert exercise media" on storage.objects
  for insert with check (bucket_id = 'exercise-media' and auth.uid() is not null);
create policy "Signed-in update exercise media" on storage.objects
  for update using (bucket_id = 'exercise-media' and auth.uid() is not null);
create policy "Signed-in delete exercise media" on storage.objects
  for delete using (bucket_id = 'exercise-media' and auth.uid() is not null);
