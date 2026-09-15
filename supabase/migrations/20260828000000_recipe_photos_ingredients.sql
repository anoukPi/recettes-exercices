-- Migration 002 — photo + ingrédients structurés pour les recettes
-- À exécuter dans l'éditeur SQL du projet Supabase (après schema.sql).

alter table recipes add column if not exists photo_url text;

alter table recipes drop column if exists ingredients;
alter table recipes add column if not exists ingredients jsonb not null default '[]'::jsonb;

insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public read recipe photos" on storage.objects;
create policy "Public read recipe photos"
  on storage.objects for select
  using (bucket_id = 'recipe-photos');

drop policy if exists "Allow insert recipe photos" on storage.objects;
create policy "Allow insert recipe photos"
  on storage.objects for insert
  with check (bucket_id = 'recipe-photos');

drop policy if exists "Allow update recipe photos" on storage.objects;
create policy "Allow update recipe photos"
  on storage.objects for update
  using (bucket_id = 'recipe-photos');

drop policy if exists "Allow delete recipe photos" on storage.objects;
create policy "Allow delete recipe photos"
  on storage.objects for delete
  using (bucket_id = 'recipe-photos');
