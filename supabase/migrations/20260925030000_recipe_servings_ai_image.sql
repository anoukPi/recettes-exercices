-- Nombre de parts d'une recette (pour saisir « 1 part » dans Repas) et image
-- générée par IA quand aucune photo n'a été enregistrée. L'image IA est
-- séparée de photo_url : une vraie photo reste prioritaire et n'est jamais
-- écrasée. Colonnes nullables : aucune donnée existante ne change.
alter table public.recipes
  add column if not exists servings integer check (servings is null or servings between 1 and 200),
  add column if not exists ai_image_url text;
