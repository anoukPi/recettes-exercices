-- Migration 022 — durée des règles (pour prédire le prochain cycle) +
-- oméga-3 comme nutriment suivi (fer, vitamine C, magnésium existent déjà).

alter table profile add column if not exists period_length_days smallint;

alter table ingredient_nutrition add column if not exists omega3_g numeric;
