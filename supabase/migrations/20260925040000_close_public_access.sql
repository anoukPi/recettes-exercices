-- Faille corrigée : des politiques « Allow all » (qual = true, rôle public)
-- restaient sur des tables de données personnelles. Avec la seule clé anon
-- (publique, présente dans le code de l'app), n'importe qui pouvait lire,
-- modifier ou supprimer repas, activités et profils. Les politiques « Own … »
-- (auth.uid() = user_id / id) existent déjà à côté et suffisent à l'app.
drop policy if exists "Allow all on journal_entries" on public.journal_entries;
drop policy if exists "Allow all on activity_entries" on public.activity_entries;
drop policy if exists "Allow all on profile" on public.profile;

-- Caches partagés (valeurs nutritives, liste d'aliments/mesures) : restent
-- communs à tous les comptes, mais seulement pour les personnes connectées.
drop policy if exists "Allow all on ingredient_nutrition" on public.ingredient_nutrition;
create policy "Signed-in users share nutrition cache" on public.ingredient_nutrition
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "Allow all on reference_items" on public.reference_items;
create policy "Signed-in users share reference items" on public.reference_items
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
