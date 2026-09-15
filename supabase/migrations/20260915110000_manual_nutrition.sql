-- Migration 014 — saisie manuelle des valeurs nutritionnelles (aliment absent d'USDA)

alter table ingredient_nutrition add column if not exists source text not null default 'usda'
  check (source in ('usda', 'manual'));
